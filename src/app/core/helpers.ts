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

/**
 * Helper class to represent a string that is delimited by a separator and
 * encoded as a URI component. This is the base representation for storing
 * compressed subnet configuration.
 *
 * @export
 * @class DelimitedString
 */
export class DelimitedString {
  /**
   * Configured separator for this string
   *
   * @type {string}
   * @memberof DelimitedString
   */
  public separator: string;

  /**
   * Parts of the delimited string to concatenate
   *
   * @type {string[]}
   * @memberof DelimitedString
   */
  public parts: string[];

  constructor(separator: string, ...parts: string[]) {
    this.separator = separator;
    this.parts = parts;
  }

  /**
   * Creates a new instance of {DelimitedString} based on an input string and a
   * separator. A separator must be found within the input string for parsing to
   * happen
   *
   * @static
   * @param input Input string to decode
   * @param separator Separator to use for string.split()
   * @returns  Parsed output as a class
   * @memberof DelimitedString
   */
  public static decode(input: string, separator: string): DelimitedString {
    if (input.indexOf(separator) === -1) {
      throw new Error(`separator '${separator}' not found in input string`);
    }

    return new DelimitedString(separator, ...input.split(separator).map((p: string) => decodeURIComponent(p)));
  }

  /**
   * Encodes this class as a string with the configured separator.
   *
   * @returns Encoded class
   * @memberof DelimitedString
   */
  public encode(): string {
    return this.parts.map((p) => encodeURIComponent(p)).join(this.separator);
  }

  /**
   * Helper method to call this.parts.push for adding item(s) to the parts array
   *
   * @param items item(s) to add
   * @memberof DelimitedString
   */
  public add(...items: string[]) {
    this.parts.push(...items);
  }
}
