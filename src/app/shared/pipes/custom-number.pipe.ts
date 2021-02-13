import { Pipe, PipeTransform } from '@angular/core';
import { csvNumber } from 'src/app/core/helpers';

@Pipe({
  name: 'customNumber',
})
export class CustomNumberPipe implements PipeTransform {
  public transform(value: number | string): string {
    return csvNumber(value);
  }
}
