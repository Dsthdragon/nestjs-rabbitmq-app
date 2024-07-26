import { Injectable } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { createInterface } from 'readline';
import { Readable } from 'stream';

@Injectable()
export class AppService {
  private readonly customerClient = ClientProxyFactory.create({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBIT_MQ_URL],
      queue: 'sent-customers',
      queueOptions: {
        durable: false,
      },
    },
  });

  base_lat: number = Number(process.env.FINTECH_LAT ?? '0');
  base_long: number = Number(process.env.FINTECH_LONG ?? '0');

  getHello(): string {
    return 'Hello World!';
  }

  async sendCustomerClient(file: Express.Multer.File) {
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    const rl = createInterface({
      input: bufferStream,
    });
    const validDatas: FileData[] = [];
    for await (const line of rl) {
      const parsedData: FileData = this.parseFileData(line);
      if (!parsedData.id || !this.verifyValidUuid(parsedData.id)) {
        console.warn(`Invalid Id for ${parsedData.id}`);
        continue;
      }
      if (!parsedData.lat || !this.verifyLatitude(parsedData.lat)) {
        console.warn(`Invalid Lat data for ${parsedData.lat}`);
        continue;
      }
      if (!parsedData.long || !this.verifyLongitude(parsedData.long)) {
        console.warn(`Invalid Long data for ${parsedData.long}`);
        continue;
      }
      const distance = this.greatCircleDistance(
        Number(parsedData.lat),
        Number(parsedData.long),
      );
      if (distance <= 100) {
        validDatas.push(parsedData);
      }
    }
    validDatas.sort((a, b) => a.id.localeCompare(b.id));
    this.customerClient.emit('general', validDatas);
    return 'Done';
  }

  testCustomerClient() {
    return 'Sent to queue';
  }

  verifyValidUuid(id: string) {
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
      id,
    );
  }

  verifyLatitude(lat: string) {
    const _lat = Number(lat);
    return _lat >= -90 && _lat <= 90;
  }
  verifyLongitude(long: string) {
    const _long = Number(long);
    return _long >= -180 && _long <= 180;
  }

  toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  greatCircleDistance(lat: number, long: number) {
    const earthRadius = 6371;
    const dLat = this.toRadians(this.base_lat - lat);
    const dLong = this.toRadians(this.base_long - long);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat)) *
        Math.cos(this.toRadians(this.base_lat)) *
        Math.sin(dLong / 2) *
        Math.sin(dLong / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }

  parseFileData(line: string): FileData {
    line = line.replace(/,\s*$/, '');
    const parsedData: Partial<FileData> = {};
    for (const part of line.split(',')) {
      const subParts = part.trim().split(':');
      parsedData[subParts[0]] = subParts[1].trim();
    }
    return parsedData as FileData;
  }
}

interface FileData {
  id: string;
  lat: string;
  long: string;
}
