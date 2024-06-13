import { CustomErrorByType } from '@neoncoder/typed-service-response';
import { RedisConnection, connectRedis } from '../lib/redis';
import { config } from '../utils/config';
import { SetOptions } from 'redis';

type TKeyFormatOptions = {
  service?: boolean;
  seperator?: string;
};

const defaultKeyFormatOptions: TKeyFormatOptions = {
  service: true,
  seperator: ':',
};

export default class CacheService {
  key?: string;

  result?: any;

  client: RedisConnection;

  constructor() {
    this.client = connectRedis();
  }
  /**
   * Set key to hold the string value. If key already holds a value, it is overwritten, regardless of its type.
   * Any previous time to live associated with the key is discarded on successful SET operation.
   * @method {@link set} - mutates and returns {@link CacheService}
   * @param {Object} val - any data to store - will be stringified
   * @param {String} [key] - key to hold data in redis. optional
   * @param {SetOptions} [options] - {@link SetOptions} Options when setting key value
   * @param {number} [options.EX] - **seconds** Set the specified expire time, in seconds (a positive integer).
   * @param {number} [options.PX] - **milliseconds** Set the specified expire time, in milliseconds (a positive integer).
   * @param {number} [options.EXAT] - **timestamp-seconds** Set the specified Unix time at which the key will expire, in seconds (a positive integer).
   * @param {number} [options.PXAT] - **timestamp-milliseconds** Set the specified Unix time at which the key will expire, in milliseconds (a positive integer).
   * @param {boolean} [options.NX] - Only set the key if it does not already exist.
   * @param {boolean} [options.XX] - Only set the key if it already exists.
   * @param {boolean} [options.KEEPTTL] - Retain the time to live associated with the key.
   * @param {boolean} [options.GET] - Return the old string stored at key, or nil if key did not exist. An error is returned and SET aborted if the value stored at key is not a string.
   * @param {?TKeyFormatOptions} [opt] - optional settings for key formatting
   * @param {string} [opt.seperator=':'] - Seperator defaults to **':'**
   * @param {string} [opt.service='true'] - Prepend key with **[appname][:][service][:]**
   * @returns {Promise<CacheService>}
   * @example
   * const cs = new CacheService()
   * const {result} = await cs.set('Some data', 'myKey')
   * // stores 'myKey' with value 'Some data'
   * // side-effects: cs.key = 'myKey', cs.result = 'OK'
   * await cs.set({data: 'someData'}, undefined, { EX: 60 })
   * // sets 'myKey' with {data: 'someData'} with TTL of 60s
   */
  async set(val: any, key?: string, options?: SetOptions, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (
      await this.connect()
    ).client.set(this.key, typeof val === 'string' ? val : JSON.stringify(val), options);
    return this;
  }
  /**
   * Sets the specified fields to their respective values in the hash stored at key.
   * This command overwrites the values of specified fields that exist in the hash.
   * If key doesn't exist, a new key holding a hash is created.
   * @async @method {@link hSet} returns mutated {@link CacheService}
   * @param {Object} data - object to store as part of the hash
   * @param {?string} [key] - key which stores hash value
   * @param {?TKeyFormatOptions} [opt] - optional settings for key formatting
   * @param {string} [opt.seperator=':'] - Seperator defaults to **':'**
   * @param {string} [opt.service='true'] - Prepend key with **[appname][:][service][:]**
   * @example
   * const cs = new CacheService()
   * const {result} = await cs.hSet({field: 'data'}, 'myHashKey')
   * // deletes 'field1', 'field2' from 'myHashKey' object. returns 2
   * // side-effects: cs.key = 'myHashKey', cs.result = 1
   * await cs.hSet({anotherField: 'data'}, undefined)
   * // adds 'anotherField' to 'myHashKey' (cs.key last set value)
   */
  async hSet(data: Record<string, string | number>, key?: string, opt?: TKeyFormatOptions) {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.hSet(this.key, Object.entries(data));
    return this;
  }

  /**
   * Get the value of key. If the key does not exist the special value nil is returned.
   * An error is returned if the value stored at key is not a string, because GET only handles string values.
   * @async @method {@link get} returns mutated {@link CacheService}
   * @param {?string} [key] - key to get value. defaults to CacheService.key
   * @param {?TKeyFormatOptions} [opt] - optional settings for key formatting
   * @param {string} [opt.seperator=':'] - Seperator defaults to **':'**
   * @param {string} [opt.service='true'] - Prepend key with **[appname][:][service][:]**
   * @returns {Promise<CacheService>}
   * @example
   * const cs = new CacheService()
   * await cs.set('myData', 'myKey') // 'OK'
   * const {result} = await cs.get('myKey') // 'myData'
   * // side-effects: cs.key = 'myKey', cs.result = 'myData'
   * await (await cs.set('updated')).get() // 'updated'
   * // sets 'updated' value to 'myKey' (cs.key last set value)
   */
  async get(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = this.parseIfJson(await (await this.connect()).client.get(this.key));
    return this;
  }

  /**
   * Returns the value associated with field in the hash stored at key.
   * @async @method {@link hGet} returns mutated {@link CacheService}
   * @param {string} field - field to get in Hash
   * @param {?string} [key] - key to get value. defaults to CacheService.key
   * @param {?TKeyFormatOptions} [opt] - optional settings for key formatting
   * @param {string} [opt.seperator=':'] - Seperator defaults to **':'**
   * @param {string} [opt.service='true'] - Prepend key with **[appname][:][service][:]**
   * @returns {Promise<CacheService>}
   * @example
   * const cs = new CacheService()
   * await cs.hSet({field1: 'data'}, 'myHashKey')
   * // sets 'field1', as 'data' on 'myHashKey' object.
   * await cs.hGet('field1') // 'data'
   * await cs.hGet('field2') // null
   */
  async hGet(field: string, key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = this.parseIfJson(await (await this.connect()).client.hGet(this.key, field));
    return this;
  }

  /**
   * Returns the values associated with the specified fields in the hash stored at key.
   * For every field that does not exist in the hash, a nil value is returned.
   * Because non-existing keys are treated as empty hashes, running HMGET against
   * a non-existing key will return a list of nil values.
   * @async @method {@link hmGet} returns mutated {@link CacheService}
   * @param {string[]} fields - fields to get in Hash
   * @param {?string} [key] - key to get value. defaults to CacheService.key
   * @param {?TKeyFormatOptions} [opt] - optional settings for key formatting
   * @param {string} [opt.seperator=':'] - Seperator defaults to **':'**
   * @param {string} [opt.service='true'] - Prepend key with **[appname][:][service][:]**
   * @returns {Promise<CacheService>}
   * @example
   * const cs = new CacheService()
   * await cs.hSet({field1: 'data'}, 'myHashKey')
   * // sets 'field1', as 'data' on 'myHashKey' object.
   * await cs.hGet('field1') // 'data'
   * await cs.hGet('field2') // null
   */
  async hmGet(fields: string[], key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = this.parseIfJson(await (await this.connect()).client.hmGet(this.key, fields));
    return this;
  }

  /**
   * Returns all fields and values of the hash stored at key. In the returned value,
   * every field name is followed by its value, so the length of the reply is twice the size of the hash.
   * @async @method {@link hGetAll} returns mutated {@link CacheService}
   * @param {?string} [key] - key to get value. defaults to CacheService.key
   * @param {?TKeyFormatOptions} [opt] - optional settings for key formatting
   * @param {string} [opt.seperator=':'] - Seperator defaults to **':'**
   * @param {string} [opt.service='true'] - Prepend key with **[appname][:][service][:]**
   * @returns {Promise<CacheService>}
   * @example
   * const cs = new CacheService()
   * await cs.hSet({field1: 'data'}, 'myHashKey')
   * await cs.hSet({field2: 'Other data'}) // cs.key = 'myHashKey'
   * await cs.hGetAll('myHashKey')
   * // {field1: 'data', field2: 'Other data'}
   */
  async hGetAll(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = this.parseIfJson(await (await this.connect()).client.hGetAll(this.key));
    return this;
  }
  /**
   * Removes the specified fields from the hash stored at key
   * Specified fields that do not exist within this hash are ignored. If key does not exist, it is treated as an empty hash and this command returns 0.
   * @method {@link hDel} - returns mutated {@link CacheService}
   * @param {Object[]} [keys] - key | keys to be deleted
   * @param {?TKeyFormatOptions} [opt] - optional settings for key formatting
   * @param {string} [opt.seperator=':'] - Seperator defaults to **':'**
   * @param {string} [opt.service='true'] - Prepend key with **[appname][:][service][:]**
   * @returns {Promise<CacheService>}
   * @example
   * const cs = new CacheService()
   * const {result} = await cs.del({}, 'key1', 'key2')
   * // deletes 'key1', 'key2' from store. returns 2
   * // side-effects: cs.key = 'myHashKey', cs.result = 2
   * await (await cs.del(undefined, 'key1')).disconnect()
   * // deletes 'key1' from storage
   * // closes connection and resets cs.key and cs.result
   */
  async del(opt?: TKeyFormatOptions, ...keys: string[]): Promise<CacheService> {
    keys.length ? null : this.assertKeyExists();
    this.result = await (await this.connect()).client.del(keys.length ? keys : this.key!);
    return this;
  }
  /**
   * Removes the specified fields from the hash stored at key
   * Specified fields that do not exist within this hash are ignored. If key does not exist, it is treated as an empty hash and this command returns 0.
   * @method {@link hDel} - returns mutated {@link CacheService}
   * @param {Object} [key] - **hashKey**
   * @param {[String]} fields - any number of fields to be deleted from the hash
   * @example
   * const cs = new CacheService()
   * const {result} = await cs.hDel('myHashKey', 'field1', 'field2')
   * // deletes 'field1', 'field2' from 'myHashKey' object. returns 2
   * // side-effects: cs.key = 'myHashKey', cs.result = 2
   * await (await cs.hDel(undefined, 'field3')).disconnect()
   * // deletes 'field3' from 'myHashKey' (cs.key last set value)
   * // closes connection and resets cs.key and cs.result
   */
  async hDel(key?: string, ...fields: string[]) {
    this.assertKeyExists(key);
    this.result = await (await this.connect()).client.hDel(this.key, fields);
    return this;
  }

  /**
   * @method {@link formatKey} - Format keys used to store in redis
   * @param {TKeyFormatOptions} [options] - Key formatting options
   * @param {string} [options.seperator=':'] - Seperator defaults to **':'**
   * @param {string} [options.service='true'] - Prepend key with **[appname][:][service][:]**
   * @param {...(string | number)[]} args
   * @returns {this}
   * @example
   * const cs = new CacheService()
   * const {key} = cs.formatKey(undefined, 'myKey', 'prt1')
   * // 'appname:servicename:myKey:prt1'
   * const {key} = cs.formatKey({seperator: '.'}, 'prt1', 'prt2')
   * // 'appname.servicename.prt1.prt2'
   * const {key} = cs.formatKey({service: false}, 'prt1', 'prt2')
   * // 'prt1:prt2'
   */
  formatKey(options?: TKeyFormatOptions, ...args: (string | number)[]): this {
    const { service, seperator } = options ?? defaultKeyFormatOptions;
    const s = seperator ?? ':';
    const sv = service ?? true;
    this.key = sv ? `${config.redis.scope}${s}${config.self.name}${s}${args.join(s)}` : `${args.join(s)}`;
    return this;
  }

  /**
   * Parse String to Json if parsable
   * @method {@link parseIfJson} returns {@link JSON} if parsable or orginal parameter
   * @template T
   * @param {?T} [jsonLike]
   * @returns {*}
   */
  parseIfJson<T>(jsonLike?: T): any {
    try {
      return jsonLike ? (typeof jsonLike === 'string' ? JSON.parse(jsonLike) : jsonLike) : null;
    } catch (e) {
      console.log({ e });
      return jsonLike;
    }
  }

  /**
   * Connects redis client if not connected
   * @async @method {@link connect}
   * @returns {Promise<CacheService>}
   */
  async connect(): Promise<CacheService> {
    if (!this.client.isReady) await this.client.connect();
    return this;
  }

  /**
   * Ensures {@link CacheService}.key is not undefined
   * @param {?string} [key] - key value to set if it's undefined
   * @param {?TKeyFormatOptions} [options] - key value to set if it's undefined
   * @returns {(asserts this is this & { key: string })}
   */
  private assertKeyExists(key?: string, options?: TKeyFormatOptions): asserts this is this & { key: string } {
    if (key) {
      this.formatKey(options, key);
    }
    if (!this.key) {
      throw new CustomErrorByType({ type: 'ExpectationFailed', message: 'Invalid redis client key' });
    }
  }

  /**
   * Disconnects redis client if connected
   * @async @method {@link disconnect}
   * @returns {Promise<void>}
   */
  async disconnect(): Promise<void> {
    if (this.client.isOpen) await this.client.disconnect();
    this.key = undefined;
    this.result = undefined;
  }
}
