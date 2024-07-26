import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  console.log(process.env.RABBIT_MQ_URL);
  app
    .connectMicroservice({
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBIT_MQ_URL],
        queueOptions: {
          durable: false,
        },
        queue: 'sent-customers',
        restart: 'always',
      },
    })
    .listen();
  const config = new DocumentBuilder()
    .setTitle('Customer data')
    .setDescription('Simple customer app')
    .setVersion('1.0')
    .addTag('cats')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}
bootstrap();
