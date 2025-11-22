import { IList, INode } from './types.js';

class LinkedList implements IList<string> {
  private head: INode<string> | null = null;
  private tail: INode<string> | null = null;
  private size: number = 0;

  // Add element to the front of the list
  unshift(value: string) {
    const newNode: INode<string> = { value, next: this.head, prev: null };

    if (this.head !== null) {
      this.head.prev = newNode;
    } else {
      this.tail = newNode;
    }

    this.head = newNode;
    this.size++;

    return this.size;
  }

  // Add element to the end of the list
  push(value: string) {
    const newNode: INode<string> = { value, next: null, prev: this.tail };

    if (this.tail !== null) {
      this.tail.next = newNode;
    } else {
      this.head = newNode;
    }

    this.tail = newNode;
    this.size++;
    return this.size;
  }

  // Remove and return element from the front
  shift() {
    if (this.head === null) return undefined;

    const value = this.head.value;
    this.head = this.head.next;

    if (this.head !== null) {
      this.head.prev = null;
    } else {
      this.tail = null;
    }

    this.size--;
    return value;
  }

  // Remove and return element from the end
  pop() {
    if (this.tail === null) return undefined;

    const value = this.tail.value;
    this.tail = this.tail.prev;

    if (this.tail !== null) {
      this.tail.next = null;
    } else {
      this.head = null;
    }

    this.size--;
    return value;
  }

  // Get element at index
  at(index: number) {
    if (index < 0 || index >= this.size) return undefined;

    let current: INode<string> | null;
    if (index < this.size / 2) {
      current = this.head;
      for (let i = 0; i < index; i++) {
        current = current!.next;
      }
    } else {
      current = this.tail;
      for (let i = this.size - 1; i > index; i--) {
        current = current!.prev;
      }
    }

    return current ? current.value : undefined;
  }

  // Set element at index
  set(index: number, value: string): void {
    if (index < 0 || index >= this.size) return;

    let current: INode<string> | null;
    if (index < this.size / 2) {
      current = this.head;
      for (let i = 0; i < index; i++) {
        current = current!.next;
      }
    } else {
      current = this.tail;
      for (let i = this.size - 1; i > index; i--) {
        current = current!.prev;
      }
    }

    if (current) {
      current.value = value;
    }
  }

  // Get slice of elements [start, end]
  slice(start: number, end: number) {
    const result: string[] = [];

    if (this.size === 0) return result;

    // Normalize indices
    let normalizedStart =
      start < 0 ? Math.max(0, this.size + start) : Math.min(start, this.size);
    let normalizedEnd =
      end < 0 ? Math.max(-1, this.size + end) : Math.min(end, this.size - 1);

    if (normalizedStart > normalizedEnd) return result;

    let current: INode<string> | null;
    if (normalizedStart < this.size / 2) {
      current = this.head;
      for (let i = 0; i < normalizedStart; i++) {
        current = current!.next;
      }
    } else {
      current = this.tail;
      for (let i = this.size - 1; i > normalizedStart; i--) {
        current = current!.prev;
      }
    }

    for (let i = normalizedStart; i <= normalizedEnd && current !== null; i++) {
      result.push(current.value);
      current = current.next;
    }

    return result;
  }

  // Trim the list to only contain elements in the specified range [start, end]
  // Note: start and end should be normalized (non-negative) indices before calling this method
  trim(start: number, end: number) {
    if (this.size === 0) return;

    // If start > end, clear the list
    if (start > end) {
      this.clear();
      return;
    }

    // Find the start node
    let startNode: INode<string> | null = null;
    if (start < this.size / 2) {
      startNode = this.head;
      for (let i = 0; i < start; i++) {
        startNode = startNode!.next;
      }
    } else {
      startNode = this.tail;
      for (let i = this.size - 1; i > start; i--) {
        startNode = startNode!.prev;
      }
    }

    // Find the end node
    let endNode: INode<string> | null = null;
    if (end < this.size / 2) {
      endNode = this.head;
      for (let i = 0; i < end; i++) {
        endNode = endNode!.next;
      }
    } else {
      endNode = this.tail;
      for (let i = this.size - 1; i > end; i--) {
        endNode = endNode!.prev;
      }
    }

    // Update head and tail
    if (startNode) {
      startNode.prev = null;
      this.head = startNode;
    }

    if (endNode) {
      endNode.next = null;
      this.tail = endNode;
    }

    // Recalculate size
    let newSize = 0;
    let current = this.head;
    while (current !== null) {
      newSize++;
      current = current.next;
    }

    this.size = newSize;
  }

  // Get the length of the list
  length(): number {
    return this.size;
  }

  // Clear the list
  clear(): void {
    this.head = null;
    this.tail = null;
    this.size = 0;
  }
}

export default LinkedList;
