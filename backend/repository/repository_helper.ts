import { HTTPRequest } from "../core/router.ts";

export type Direction = 'ASC' | 'DESC';

export function toDateOrNull (ts: number): Date | null {
  return (ts) ? new Date(ts) : null
}

export class Sorter {
  private _field: string;
  private _direction: Direction = 'ASC';

  constructor(field = 'created_at', direction: Direction = 'ASC') {
    this._field = field;
    this._direction = direction;
  }

  get field () {
    return this._field;
  }

  public toString (): string {
    if (this._direction === 'ASC') {
      return `+${this._field}`;
    }
    return `-${this._field}`;
  }

  public toSql (): string {
    return `${this._field} ${this._direction}`;
  }

  public static fromString (str = '') {
    if (str.indexOf('-') === 0) {
      return new Sorter(str.replaceAll('-', ''), 'DESC');
    } else {
      return new Sorter(str.replaceAll('+', ''), 'ASC');
    }
  }

}

export type Page = Array<Record<string, unknown>>;


export class DbCursor {
  private _limit = 255;
  private _field: string;
  private _additionalSortFields: Sorter[] = []
  private _current: number | string;

  constructor(field = 'created_at', current: number | string, limit = 255) {
    this._field = field
    this._current = current;
    this._limit = limit;
    this._additionalSortFields.push(new Sorter(field));
  }

  get field () {
    return this._field;
  }

  public whereSql (): string {
    return `${this._field} > ${this._current}`;
  }

  public orderBySql (): string {
    let sql = `ORDER BY `;
    this._additionalSortFields.forEach((s, index) => {
      sql += (index) ? ` , ${s.toSql()}` : s.toSql()
    })
    return sql;
  }

  public addSort (sort: Sorter) {
    if (this._additionalSortFields.filter((s) => s.field == sort.field).length === 0) {
      this._additionalSortFields.push(sort);
    }
  }

  public limitSql (): string {
    return `LIMIT ${this._limit}`
  }

  public toSql (): string {
    return `${this.whereSql()} ${this.orderBySql()} ${this.limitSql()}`;
  }

  public urlEncode (): string {
    const str = this.toString();

    // TODO: URL encode string

    return str;
  }

  public next (count: number, next: number | string): DbCursor | null {
    if (count > 0 && count <= this._limit) {
      const cursor = new DbCursor(this._field, next, this._limit);
      this._additionalSortFields.forEach((s) => cursor.addSort(s));
      return cursor;
    }
    return null;
  }

  public toString (): string {
    const sort = this._additionalSortFields.reduce((str, s) => {
      str += (str) ? `$${s.toString()}` : `${s.toString()}`
      return str;
    }, '')

    // where field | Current value | limit | sort fields
    return `${this._field}|${this._current}|${this._limit}|${sort}`
  }

  public toJSON () {
    return {
      field: this._field,
      current: this._current,
      limit: this._limit,
      sort: this._additionalSortFields.map((s) => s.toString()),
    }
  }

  public toEncodedString (): string {
    return encodeURIComponent(this.toString())
  }


  public static fromHttpRequest (req: HTTPRequest): DbCursor | false {
    let str = '';
    if (req.headers.has('cursor')) {
      str = req.headers.get('cursor') || '';
    }

    if (!str && req.query.has('cursor')) {
      str = req.query.get('cursor') || '';
    }

    return (str) ? DbCursor.fromEncodedString(str) : false;
  }

  public static fromEncodedString (encode: string): DbCursor {
    return DbCursor.fromString(decodeURIComponent(encode));
  }

  public static fromString (str: string): DbCursor {
    // str =>  where field | last value | limit | sort fields
    const pieces = str.split('|');

    let field = 'created_at';
    let current: string | number = 0;
    let limit = 255;
    const sorts: Sorter[] = [];

    // field
    if (pieces[0]) {
      field = pieces[0];
    }

    // current 
    if (pieces[1]) {
      current = pieces[1] as string;
    }

    // limit
    if (pieces[2]) {
      limit = parseInt(pieces[2], 10);
    }

    // sort
    if (pieces[3]) { // sort fields  => +field$-field$+field
      pieces[3].split('$').forEach((s) => sorts.push(Sorter.fromString(s)));
    }

    const cursor = new DbCursor(field, current, limit);
    sorts.forEach((s) => cursor.addSort(s))


    return cursor;
  }

}