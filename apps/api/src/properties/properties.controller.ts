import { Controller, Get } from '@nestjs/common';

@Controller('properties')
export class PropertiesController {
  @Get()
  list() {
    return [
      {
        id: 'demo-1',
        tenantId: 'tenant-ketris',
        title: 'Apartamento mobiliado no Centro',
        city: 'Sao Paulo',
        state: 'SP',
        price: 4200,
      },
      {
        id: 'demo-2',
        tenantId: 'tenant-ketris',
        title: 'Casa com quintal e escritorio',
        city: 'Campinas',
        state: 'SP',
        price: 6800,
      },
    ];
  }
}
