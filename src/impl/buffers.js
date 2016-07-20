'use strict';

export {
    dequeue,
    Buffer,
    DroppingBuffer,
    SlidingBuffer
};

// A trivial implementation of a dequeue using a linked list. Channel buffers
// are unbounded by default, so an array circular buffer would require complexity
// handling memory management, and we have other things to do in life.

function dequeue() {
    var head = null;
    var tail = null;
    var length = 0;

    return Object.freeze({
        length,
        get,
        unshift,
        shift,
        push,
        pop,
        head: () => head ? head.val : null,
        tail: () => tail ? tail.val : null
    });

    function unshift(item) {
        head = Object.freeze({
            val: item,
            prev: null,
            next: head
        });

        head.next.prev = head;
        length += 1;
        return head.val;
    }

    function shift() {
        if( head === null ) return null;
        head = head.next;
        return remove(head.prev);
    }

    function push(item) {
        tail = Object.freeze({
            val: item,
            prev: tail,
            next: null
        });

        tail.prev.next = tail;
        length += 1;
        return tail.val;
    }

    function pop() {
        if( tail === null ) return null;
        tail = tail.prev;
        return remove(tail.next);
    }

    function get(i) {
        if( i >= length ) return null;

        let x = 0;
        let node = head;
        while( x < i ) {
            node = node.next;
            x += 1;
        }

        return node;
    }

    function remove(node) {
        if( node.prev ) node.prev.next = node.next;
        if( node.next ) node.next.prev = node.prev;
        length -= 1;
        return node.val;
    }
}

function Buffer(n = Infinity) {
    const buffer = dequeue();

    return Object.freeze({
        put: x => {
            if( buffer.length === n ) {
                return null;
            }
            return buffer.unshift(x);
        },
        take: () => {
            if( buffer.length === 0 ) {
                return null;
            }
            return buffer.pop();
        },
        isFull: () => buffer.length === n,
        isEmpty: () => buffer.length === 0
    });
}

function DroppingBuffer(n = Infinity) {
    const buffer = dequeue();

    return Object.freeze({
        put: (x) => {
            if( buffer.length < n ) {
                buffer.unshift(x);
            }
            return buffer.head;
        },
        take: () => {
            if( buffer.length === 0 ) {
                return null;
            }
            return buffer.pop();
        },
        isFull: () => false,
        isEmpty: () => buffer.length === 0
    });
}

function SlidingBuffer(n = Infinity) {
    const buffer = dequeue();

    return Object.freeze({
        put: (x) => {
            if( buffer.length === n ) {
                buffer.pop();
            }
            return buffer.unshift(x);
        },
        take: () => {
            if( buffer.length === 0 ) {
                return null;
            }
            return buffer.pop();
        },
        isFull: () => false,
        isEmpty: () => buffer.length === 0
    })
}
