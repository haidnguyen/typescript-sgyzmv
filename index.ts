// Import stylesheets
import './style.css';

// Write TypeScript code!
const appDiv: HTMLElement = document.getElementById('app');
appDiv.innerHTML = `<h1>TypeScript Starter</h1>`;

interface ProxyCallbackOptions {
  path: string[];
  args: unknown[];
}
type ProxyCallback = (opts: ProxyCallbackOptions) => unknown;

const noop = () => {
  // noop
};

function createInnerProxy(callback: ProxyCallback, path: string[]) {
  const proxy: unknown = new Proxy(noop, {
    get(_obj, key) {
      // console.log('inner get', { key, path });
      if (typeof key !== 'string' || key === 'then') {
        // special case for if the proxy is accidentally treated
        // like a PromiseLike (like in `Promise.resolve(proxy)`)
        return undefined;
      }
      return createInnerProxy(callback, [...path, key]);
    },
    apply(_1, _2, args) {
      const isApply = path[path.length - 1] === 'apply';
      // console.log('inner apply', { path, args, isApply });
      return callback({
        args: isApply ? (args.length >= 2 ? args[1] : []) : args,
        path: isApply ? path.slice(0, -1) : path,
      });
    },
  });

  return proxy;
}

/**
 * Creates a proxy that calls the callback with the path and arguments
 *
 * @internal
 */
export const createRecursiveProxy = (callback: ProxyCallback) =>
  createInnerProxy(callback, []);

/**
 * Used in place of `new Proxy` where each handler will map 1 level deep to another value.
 *
 * @internal
 */
export const createFlatProxy = <TFaux>(
  callback: (path: keyof TFaux & string) => any,
): TFaux => {
  return new Proxy(noop, {
    get(_obj, name) {
      console.log({ _obj, name });
      if (typeof name !== 'string' || name === 'then') {
        // special case for if the proxy is accidentally treated
        // like a PromiseLike (like in `Promise.resolve(proxy)`)
        return undefined;
      }
      return callback(name as any);
    },
  }) as TFaux;
};

const client = {
  a: {
    b: {
      c: {
        query: (test: string) => {
          return 'wpow' + ' ' + test;
        }
      }
    }
  }
}

const p2 = createRecursiveProxy(({ path, args }) => {
  console.log('asda', { path, args });

  const t = path.reduce((acc, cur, index) => {
    if (index === path.length - 1) {
      console.log('here');
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(acc[cur](...args));
        }, 100);
      })
    }

    return acc[cur];
  }, client);
  
  return t;
})

console.log(p2.a.b.c.query('aaa'))

p2.a.b.c.query('test').then(resp => console.log({ resp }));