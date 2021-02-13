import { Observable, Subject } from 'rxjs';

/**
 * Represents an object which can be encoded/decoded to a string
 *
 * @export
 * @interface Encodable
 */
export interface Encodable<T> {
  encode(): string;
  decode(input: string): T;
}

export const csvNumber = (n: number | string): string => n?.toString()?.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
