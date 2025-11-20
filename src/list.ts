import LinkedList from './linked-list.js';
import { IList, TDataType } from './types.js';

class List implements IList<TDataType> {
  private items: LinkedList<TDataType>;

  constructor() {
    this.items = new LinkedList<TDataType>();
  }

  lPush(value: TDataType) {
    return this.items.unshift(value);
  }

  rPush(value: TDataType) {
    return this.items.push(value);
  }

  lPop() {
    return this.items.shift();
  }

  rPop() {
    return this.items.pop();
  }

  lRange(start: number, end: number) {
    return this.items.slice(start, end + 1);
  }

  length() {
    return this.items.length();
  }
}

export default List;
