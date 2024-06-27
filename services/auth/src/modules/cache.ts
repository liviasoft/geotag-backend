import { CustomErrorByType } from '@neoncoder/typed-service-response';
import { RedisConnection, connectRedis } from '../lib/redis';
import { config } from '../utils/config';
import { SetOptions } from 'redis';
import {
  GeoSearchOptions,
  GeoUnits,
  GeoCoordinates,
  ZMember,
} from '@redis/client/dist/lib/commands/generic-transformers';
import { RedisCommandArgument } from '@redis/client/dist/lib/commands/index';

interface NX {
  NX?: true;
}
interface XX {
  XX?: true;
}
interface LT {
  LT?: true;
}
interface GT {
  GT?: true;
}
interface CH {
  CH?: true;
}
interface INCR {
  INCR?: true;
}
interface GeoMember extends GeoCoordinates {
  member: RedisCommandArgument;
}

interface XRangeRevOptions {
  COUNT?: number;
}
interface NX {
  NX?: true;
}
interface XX {
  XX?: true;
}
type SetGuards = NX | XX;

type GeoAddOptions = SetGuards & GeoAddCommonOptions;
interface GeoAddCommonOptions {
  CH?: true;
}

type ZAddOptions = (NX | (XX & LT & GT)) & CH & INCR;

type TKeyFormatOptions = {
  scopeToService?: boolean;
  seperator?: string;
  useRaw?: boolean;
};

const defaultKeyFormatOptions: TKeyFormatOptions = {
  scopeToService: true,
  seperator: ':',
  useRaw: false,
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
    console.log({ key, data });
    this.result = await (await this.connect()).client.hSet(this.key, Object.entries(data));
    console.log({ result: this.result, key: this.key });
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

  // List Commands

  /**
   * Inserts one or more values at the head of the list stored at key.
   * @async @method {@link lPush} returns mutated {@link CacheService}
   * @param {string[]} values - Values to insert into the list
   * @param {?string} [key] - Key which stores the list
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async lPush(values: string[], key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.lPush(this.key, values);
    return this;
  }

  /**
   * Inserts one or more values at the tail of the list stored at key.
   * @async @method {@link rPush} returns mutated {@link CacheService}
   * @param {string[]} values - Values to insert into the list
   * @param {?string} [key] - Key which stores the list
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async rPush(values: string[], key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.rPush(this.key, values);
    return this;
  }

  /**
   * Removes and gets the first element in a list.
   * @async @method {@link lPop} returns mutated {@link CacheService}
   * @param {?string} [key] - Key which stores the list
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async lPop(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = this.parseIfJson(await (await this.connect()).client.lPop(this.key));
    return this;
  }

  /**
   * Removes and gets the last element in a list.
   * @async @method {@link rPop} returns mutated {@link CacheService}
   * @param {?string} [key] - Key which stores the list
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async rPop(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = this.parseIfJson(await (await this.connect()).client.rPop(this.key));
    return this;
  }

  /**
   * Gets a range of elements from a list.
   * @async @method {@link lRange} returns mutated {@link CacheService}
   * @param {number} start - Start index of the range
   * @param {number} stop - Stop index of the range
   * @param {?string} [key] - Key which stores the list
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async lRange(start: number, stop: number, key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = this.parseIfJson(await (await this.connect()).client.lRange(this.key, start, stop));
    return this;
  }

  /**
   * Gets the length of a list.
   * @async @method {@link lLen} returns mutated {@link CacheService}
   * @param {?string} [key] - Key which stores the list
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async lLen(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.lLen(this.key);
    return this;
  }

  // Set Commands

  /**
   * Adds one or more members to a set.
   * @async @method {@link sAdd} returns mutated {@link CacheService}
   * @param {string[]} members - Members to add to the set
   * @param {?string} [key] - Key which stores the set
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async sAdd(members: string[], key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.sAdd(this.key, members);
    return this;
  }

  /**
   * Removes one or more members from a set.
   * @async @method {@link sRem} returns mutated {@link CacheService}
   * @param {string[]} members - Members to remove from the set
   * @param {?string} [key] - Key which stores the set
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async sRem(members: string[], key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.sRem(this.key, members);
    return this;
  }

  /**
   * Gets all the members in a set.
   * @async @method {@link sMembers} returns mutated {@link CacheService}
   * @param {?string} [key] - Key which stores the set
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async sMembers(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.sMembers(this.key);
    return this;
  }

  // Sorted Set Commands

  /**
   * Adds one or more members to a sorted set.
   * @async @method {@link zAdd} returns mutated {@link CacheService}
   * @param {{[key: string]: number}} membersWithScores - Members to add to the sorted set with associated scores
   * @param {?string} [key] - Key which stores the sorted set
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async zAdd(
    membersWithScores: ZMember | ZMember[],
    options?: ZAddOptions,
    key?: string,
    opt?: TKeyFormatOptions,
  ): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    // this.result = await (await this.connect()).client.zAdd(this.key, membersWithScores);
    this.result = await (await this.connect()).client.zAdd(this.key, membersWithScores, options);
    return this;
  }

  /**
   * Removes one or more members from a sorted set.
   * @async @method {@link zRem} returns mutated {@link CacheService}
   * @param {string[]} members - Members to remove from the sorted set
   * @param {?string} [key] - Key which stores the sorted set
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async zRem(members: string[], key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.zRem(this.key, members);
    return this;
  }

  /**
   * Gets a range of members in a sorted set, by index.
   * @async @method {@link zRange} returns mutated {@link CacheService}
   * @param {number} start - Start index of the range
   * @param {number} stop - Stop index of the range
   * @param {?string} [key] - Key which stores the sorted set
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async zRange(start: number, stop: number, key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.zRange(this.key, start, stop);
    return this;
  }

  /**
   * Gets a range of members in a sorted set, by index, with scores ordered from high to low.
   * @async @method {@link zRevRange} returns mutated {@link CacheService}
   * @param {number} start - Start index of the range
   * @param {number} stop - Stop index of the range
   * @param {?string} [key] - Key which stores the sorted set
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async zRevRange(
    start: RedisCommandArgument,
    stop: RedisCommandArgument,
    options?: XRangeRevOptions,
    key?: string,
    opt?: TKeyFormatOptions,
  ): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    // this.result = await (await this.connect()).client.xRevRange(this.key, start, stop);
    this.result = await (await this.connect()).client.xRevRange(this.key, start, stop, options);
    return this;
  }

  /**
   * Gets a range of members in a sorted set, by score.
   * @async @method {@link zRangeByScore} returns mutated {@link CacheService}
   * @param {number | string} min - Minimum score
   * @param {number | string} max - Maximum score
   * @param {?string} [key] - Key which stores the sorted set
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async zRangeByScore(
    min: number | string,
    max: number | string,
    key?: string,
    opt?: TKeyFormatOptions,
  ): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.zRangeByScore(this.key, min, max);
    return this;
  }

  /**
   * Gets the number of members in a sorted set.
   * @async @method {@link zCard} returns mutated {@link CacheService}
   * @param {?string} [key] - Key which stores the sorted set
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async zCard(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.zCard(this.key);
    return this;
  }

  // Transaction Commands

  /**
   * Marks the start of a transaction block. Subsequent commands will be queued for atomic execution.
   * @async @method {@link multi} returns mutated {@link CacheService}
   * @returns {Promise<CacheService>}
   */
  async multi(): Promise<CacheService> {
    this.result = await (await this.connect()).client.multi();
    return this;
  }

  /**
   * Executes all commands issued after {@link multi}.
   * @async @method {@link exec} returns mutated {@link CacheService}
   * @returns {Promise<CacheService>}
   */
  async exec(): Promise<CacheService> {
    this.result = await (await this.connect()).client.multi().exec();
    return this;
  }

  /**
   * Discards all commands issued after {@link multi}.
   * @async @method {@link discard} returns mutated {@link CacheService}
   * @returns {Promise<CacheService>}
   */
  async discard(): Promise<CacheService> {
    this.result = await (await this.connect()).client.discard();
    return this;
  }

  /**
   * Marks the given keys to be watched for conditional execution of a transaction.
   * @async @method {@link watch} returns mutated {@link CacheService}
   * @param {string[]} keys - Keys to watch
   * @returns {Promise<CacheService>}
   */
  async watch(keys: string[]): Promise<CacheService> {
    this.result = await (await this.connect()).client.watch(keys);
    return this;
  }

  // Geospatial Commands

  /**
   * Adds one or more geospatial items (latitude, longitude, name) to the specified key.
   * @async @method {@link geoAdd} returns mutated {@link CacheService}
   * @param {{ longitude: number, latitude: number, member: string }[]} items - Geospatial items to add
   * @param {?string} [key] - Key to store the geospatial items
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async geoAdd(
    items: GeoMember | GeoMember[],
    options?: GeoAddOptions,
    key?: string,
    opt?: TKeyFormatOptions,
  ): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.geoAdd(this.key, items, options);
    // .geoAdd(
    //   this.key,
    //   items.map(({ longitude, latitude, member }) => [longitude, latitude, member]),
    // );
    return this;
  }

  /**
   * Returns the distance between two members in the geospatial index specified by the key.
   * @async @method {@link geoDist} returns mutated {@link CacheService}
   * @param {string} member1 - First member
   * @param {string} member2 - Second member
   * @param {?string} [unit='m'] - Unit of distance, defaults to meters ('m')
   * @param {?string} [key] - Key storing the geospatial index
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async geoDist(
    member1: string,
    member2: string,
    unit: GeoUnits,
    key?: string,
    opt?: TKeyFormatOptions,
  ): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.geoDist(this.key, member1, member2, unit);
    return this;
  }

  /**
   * Queries a sorted set representing a geospatial index to fetch members matching certain conditions.
   * @async @method {@link geoRadius} returns mutated {@link CacheService}
   * @param {number} longitude - Longitude to use as the center of the search radius
   * @param {number} latitude - Latitude to use as the center of the search radius
   * @param {number} radius - Radius of the search area (in units specified by 'unit')
   * @param {string} unit - Unit of distance ('m' for meters, 'km' for kilometers, 'mi' for miles, 'ft' for feet)
   * @param {?{ withCoordinates?: boolean, withDistance?: boolean, withHash?: boolean, count?: number, order?: 'ASC' | 'DESC' }} [options] - Optional settings for the query
   * @param {?string} [key] - Key storing the geospatial index
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async geoRadius(
    coordinates: GeoCoordinates,
    radius: number,
    unit: GeoUnits,
    options?: GeoSearchOptions,
    key?: string,
    opt?: TKeyFormatOptions,
  ): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    // this.result = await (await this.connect()).client.geoRadius(this.key, longitude, latitude, radius, unit, options);
    this.result = await (await this.connect()).client.geoRadius(this.key, coordinates, radius, unit, options);
    return this;
  }

  /**
   * Queries a sorted set representing a geospatial index to fetch members within a specified distance of a given member.
   * @async @method {@link geoRadiusByMember} returns mutated {@link CacheService}
   * @param {string} member - Member to use as the center of the search radius
   * @param {number} radius - Radius of the search area (in units specified by 'unit')
   * @param {string} unit - Unit of distance ('m' for meters, 'km' for kilometers, 'mi' for miles, 'ft' for feet)
   * @param {?{ withCoordinates?: boolean, withDistance?: boolean, withHash?: boolean, count?: number, order?: 'ASC' | 'DESC' }} [options] - Optional settings for the query
   * @param {?string} [key] - Key storing the geospatial index
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   * 
   * {
      withCoordinates?: boolean;
      withDistance?: boolean;
      withHash?: boolean;
      count?: number;
      order?: 'ASC' | 'DESC';
    }
   */
  async geoRadiusByMember(
    member: string,
    radius: number,
    unit: GeoUnits,
    options?: GeoSearchOptions,
    key?: string,
    opt?: TKeyFormatOptions,
  ): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.geoRadiusByMember(this.key, member, radius, unit, options);
    return this;
  }

  /**
   * Returns the GeoHash strings representing the position of one or more members in a geospatial index.
   * @async @method {@link geoHash} returns mutated {@link CacheService}
   * @param {string[]} members - Members for which to get GeoHash strings
   * @param {?string} [key] - Key storing the geospatial index
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async geoHash(members: string[], key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.geoHash(this.key, members);
    return this;
  }

  // String Commands

  /**
   * Increments the integer value of a key by one.
   * @async @method {@link incr} returns mutated {@link CacheService}
   * @param {?string} [key] - Key to increment
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async incr(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.incr(this.key);
    return this;
  }

  /**
   * Decrements the integer value of a key by one.
   * @async @method {@link decr} returns mutated {@link CacheService}
   * @param {?string} [key] - Key to decrement
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async decr(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.decr(this.key);
    return this;
  }

  /**
   * Appends a value to a key.
   * @async @method {@link append} returns mutated {@link CacheService}
   * @param {string} value - Value to append
   * @param {?string} [key] - Key to append the value to
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async append(value: string, key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.append(this.key, value);
    return this;
  }

  /**
   * Gets a substring of the value of a key between the specified offsets.
   * @async @method {@link getRange} returns mutated {@link CacheService}
   * @param {number} start - Start offset (0-based)
   * @param {number} end - End offset (inclusive)
   * @param {?string} [key] - Key to get the substring from
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async getRange(start: number, end: number, key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.getRange(this.key, start, end);
    return this;
  }

  /**
   * Overwrites part of the value of a key starting at the specified offset.
   * @async @method {@link setRange} returns mutated {@link CacheService}
   * @param {number} offset - Offset at which to start overwriting
   * @param {string} value - Value to overwrite with
   * @param {?string} [key] - Key to set the range in
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async setRange(offset: number, value: string, key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.setRange(this.key, offset, value);
    return this;
  }

  /**
   * Checks if a key exists.
   * @async @method {@link exists} returns mutated {@link CacheService}
   * @param {?string} [key] - Key to check existence of
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async exists(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.exists(this.key);
    return this;
  }

  /**
   * Persists the expiration of a key by removing the associated expiration time.
   * @async @method {@link persist} returns mutated {@link CacheService}
   * @param {?string} [key] - Key to persist the expiration of
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async persist(key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.persist(this.key);
    return this;
  }

  // Hash Commands

  /**
   * Checks if a field exists in the hash stored at the key.
   * @async @method {@link hExists} returns mutated {@link CacheService}
   * @param {string} field - Field to check existence of
   * @param {?string} [key] - Key storing the hash
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async hExists(field: string, key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.hExists(this.key, field);
    return this;
  }

  /**
   * Increments the integer value of a field in a hash by the specified increment.
   * @async @method {@link hIncrBy} returns mutated {@link CacheService}
   * @param {string} field - Field to increment
   * @param {number} increment - Increment value
   * @param {?string} [key] - Key storing the hash
   * @param {?TKeyFormatOptions} [opt] - Optional settings for key formatting
   * @returns {Promise<CacheService>}
   */
  async hIncrBy(field: string, increment: number, key?: string, opt?: TKeyFormatOptions): Promise<CacheService> {
    this.assertKeyExists(key, opt);
    this.result = await (await this.connect()).client.hIncrBy(this.key, field, increment);
    return this;
  }

  /**
   * @method {@link formatKey} - Format keys used to store in redis
   * @param {TKeyFormatOptions} [options] - Key formatting options
   * @param {string} [options.seperator=':'] - Seperator defaults to **':'**
   * @param {string} [options.scopeToService='true'] - default is true. If true **[appname][:][service][:]** else **[appname][:]**
   * @param {string} [options.useRaw='true'] - User Raw params with seperator to make key
   * @param {...(string | number)[]} args
   * @returns {this}
   * @example
   * const cs = new CacheService()
   * const {key} = cs.formatKey(undefined, 'myKey', 'prt1')
   * // 'appname:servicename:myKey:prt1'
   * const {key} = cs.formatKey({seperator: '.'}, 'prt1', 'prt2')
   * // 'appname.servicename.prt1.prt2'
   * const {key} = cs.formatKey({scopeToService: false}, 'prt1', 'prt2')
   * // 'appname:myKey:prt1:prt2'
   * const {key} = cs.formatKey({useRaw: true}, 'prt1', 'prt2')
   * // 'prt1:prt2'
   */
  formatKey(options?: TKeyFormatOptions, ...args: (string | number)[]): this {
    const { scopeToService, seperator, useRaw } = options ?? defaultKeyFormatOptions;
    const s = seperator ?? ':';
    if (useRaw) {
      this.key = `${args.join(s)}`;
    }
    const sv = scopeToService ?? true;
    this.key = sv
      ? `${config.appName}${s}${config.self.name}${s}${args.join(s)}`
      : `${config.appName}${s}${args.join(s)}`;
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
