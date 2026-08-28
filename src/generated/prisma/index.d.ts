
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Inquiry
 * 
 */
export type Inquiry = $Result.DefaultSelection<Prisma.$InquiryPayload>
/**
 * Model DraftProposal
 * ── Phase-2 Module 7: AI Service Finder leads ────────────────
 *    When the AI chat widget qualifies a visitor and captures their
 *    email, a draft proposal is auto-created so it appears in the
 *    admin Proposals tab ready to review and send.
 */
export type DraftProposal = $Result.DefaultSelection<Prisma.$DraftProposalPayload>
/**
 * Model WebhookLog
 * ── Phase-2 Module 7: Paystack webhook audit log ─────────────
 *    Every incoming webhook (charge.success, transfer.success, …)
 *    is persisted here — the money trail the admin can inspect.
 */
export type WebhookLog = $Result.DefaultSelection<Prisma.$WebhookLogPayload>
/**
 * Model AdminSession
 * 
 */
export type AdminSession = $Result.DefaultSelection<Prisma.$AdminSessionPayload>
/**
 * Model Subscriber
 * 
 */
export type Subscriber = $Result.DefaultSelection<Prisma.$SubscriberPayload>
/**
 * Model Post
 * 
 */
export type Post = $Result.DefaultSelection<Prisma.$PostPayload>
/**
 * Model Testimonial
 * 
 */
export type Testimonial = $Result.DefaultSelection<Prisma.$TestimonialPayload>
/**
 * Model EmailLog
 * 
 */
export type EmailLog = $Result.DefaultSelection<Prisma.$EmailLogPayload>
/**
 * Model EmailProviderConfig
 * ── Phase 29: AES-256-GCM-encrypted email provider credentials ──
 *    The failover chain (apps_script → resend → mailtrap → maileroo)
 *    iterates enabled rows in `priority` order (lower = tried first).
 *    `credentialsEnc` is base64(iv|ciphertext|tag) — never plaintext.
 *    Rotation requires re-entering all credentials because the
 *    encryption key is what makes the ciphertext readable.
 */
export type EmailProviderConfig = $Result.DefaultSelection<Prisma.$EmailProviderConfigPayload>
/**
 * Model ReceivedEmail
 * ── Phase-1 Module 2: audit-trail models ────────────────────
 *    Directive asked for Mongoose models; this stack is Prisma +
 *    SQLite (deployed on Render with a persistent disk — migrating
 *    to Mongo would break the deployment kit and every preserved
 *    workflow). Equivalent Prisma models deliver the same audit
 *    goals without the regression. Mappings:
 *      received_emails → ReceivedEmail
 *      sent_emails     → EmailLog (extended above — the admin Email
 *                        log UI already reads it; a duplicate table
 *                        would drift)
 *      invoices        → Invoice
 *      events          → EventRecord
 *      whatsapp_messages → WhatsAppMessage
 */
export type ReceivedEmail = $Result.DefaultSelection<Prisma.$ReceivedEmailPayload>
/**
 * Model Invoice
 * 
 */
export type Invoice = $Result.DefaultSelection<Prisma.$InvoicePayload>
/**
 * Model EventRecord
 * 
 */
export type EventRecord = $Result.DefaultSelection<Prisma.$EventRecordPayload>
/**
 * Model WhatsAppMessage
 * 
 */
export type WhatsAppMessage = $Result.DefaultSelection<Prisma.$WhatsAppMessagePayload>
/**
 * Model AnalyticsEvent
 * ── Phase-2 Module 8C: first-party analytics events ─────────
 *    GA4 receives the same names via dataLayer/gtag; this table is
 *    the source of truth the Admin Analytics dashboard queries
 *    (works with or without a GA4 property configured).
 */
export type AnalyticsEvent = $Result.DefaultSelection<Prisma.$AnalyticsEventPayload>
/**
 * Model BackupLog
 * ── Phase-2 Module 8B: daily 02:00 backup audit trail ────────
 *    Every backup run (Google Drive target when credentials exist,
 *    local rotation fallback otherwise) is recorded here.
 */
export type BackupLog = $Result.DefaultSelection<Prisma.$BackupLogPayload>
/**
 * Model Customer
 * ── Stage 11 CRM: canonical Customer record ─────────────────────
 *    The CRM unifies Inquiries + Invoices + EmailLog + WhatsAppMessage
 *    + Subscribers by customerEmail. A Customer row is the canonical
 *    contact: name, email, phone, whatsapp, company, status, tags,
 *    notes (free-text), source (manual | csv | inquiry | ai_chat |
 *    invoice), and an internal notes trail.
 * 
 *    Why a separate Customer table vs. just virtualizing off Inquiries:
 *    - Lets the admin add prospects that haven't submitted an inquiry
 *      yet (e.g. from a CSV upload, a networking event, a referral).
 *    - Gives the admin a stable ID to attach notes / tags / status to,
 *      independent of which channel the contact came in through.
 *    - Makes the CRM searchable + filterable in one query (no N-table
 *      union needed at render time).
 * 
 *    The detail view still aggregates interactions from the existing
 *    tables by customerEmail so historical rows created BEFORE the CRM
 *    feature ship are visible too — zero migration needed.
 */
export type Customer = $Result.DefaultSelection<Prisma.$CustomerPayload>
/**
 * Model CustomerNote
 * ── Stage 11 CRM: internal note trail per customer ─────────────
 */
export type CustomerNote = $Result.DefaultSelection<Prisma.$CustomerNotePayload>
/**
 * Model CustomerMessage
 * ── Stage 11 CRM: admin-to-customer message log ────────────────
 *    Records every outbound message sent FROM the admin CRM. The
 *    actual delivery is via the existing email pipeline (notify.ts →
 *    Apps Script for branded Gmail) and the WhatsApp mini-service.
 *    Replies come back via the inbound WhatsApp + email-poll routes
 *    and land in WhatsAppMessage / ReceivedEmail — the CRM detail
 *    view aggregates both sides into one timeline.
 */
export type CustomerMessage = $Result.DefaultSelection<Prisma.$CustomerMessagePayload>

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Inquiries
 * const inquiries = await prisma.inquiry.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Inquiries
   * const inquiries = await prisma.inquiry.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.inquiry`: Exposes CRUD operations for the **Inquiry** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Inquiries
    * const inquiries = await prisma.inquiry.findMany()
    * ```
    */
  get inquiry(): Prisma.InquiryDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.draftProposal`: Exposes CRUD operations for the **DraftProposal** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DraftProposals
    * const draftProposals = await prisma.draftProposal.findMany()
    * ```
    */
  get draftProposal(): Prisma.DraftProposalDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.webhookLog`: Exposes CRUD operations for the **WebhookLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WebhookLogs
    * const webhookLogs = await prisma.webhookLog.findMany()
    * ```
    */
  get webhookLog(): Prisma.WebhookLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.adminSession`: Exposes CRUD operations for the **AdminSession** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AdminSessions
    * const adminSessions = await prisma.adminSession.findMany()
    * ```
    */
  get adminSession(): Prisma.AdminSessionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.subscriber`: Exposes CRUD operations for the **Subscriber** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Subscribers
    * const subscribers = await prisma.subscriber.findMany()
    * ```
    */
  get subscriber(): Prisma.SubscriberDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.post`: Exposes CRUD operations for the **Post** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Posts
    * const posts = await prisma.post.findMany()
    * ```
    */
  get post(): Prisma.PostDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.testimonial`: Exposes CRUD operations for the **Testimonial** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Testimonials
    * const testimonials = await prisma.testimonial.findMany()
    * ```
    */
  get testimonial(): Prisma.TestimonialDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.emailLog`: Exposes CRUD operations for the **EmailLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EmailLogs
    * const emailLogs = await prisma.emailLog.findMany()
    * ```
    */
  get emailLog(): Prisma.EmailLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.emailProviderConfig`: Exposes CRUD operations for the **EmailProviderConfig** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EmailProviderConfigs
    * const emailProviderConfigs = await prisma.emailProviderConfig.findMany()
    * ```
    */
  get emailProviderConfig(): Prisma.EmailProviderConfigDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.receivedEmail`: Exposes CRUD operations for the **ReceivedEmail** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ReceivedEmails
    * const receivedEmails = await prisma.receivedEmail.findMany()
    * ```
    */
  get receivedEmail(): Prisma.ReceivedEmailDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.invoice`: Exposes CRUD operations for the **Invoice** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Invoices
    * const invoices = await prisma.invoice.findMany()
    * ```
    */
  get invoice(): Prisma.InvoiceDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.eventRecord`: Exposes CRUD operations for the **EventRecord** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EventRecords
    * const eventRecords = await prisma.eventRecord.findMany()
    * ```
    */
  get eventRecord(): Prisma.EventRecordDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.whatsAppMessage`: Exposes CRUD operations for the **WhatsAppMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more WhatsAppMessages
    * const whatsAppMessages = await prisma.whatsAppMessage.findMany()
    * ```
    */
  get whatsAppMessage(): Prisma.WhatsAppMessageDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.analyticsEvent`: Exposes CRUD operations for the **AnalyticsEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AnalyticsEvents
    * const analyticsEvents = await prisma.analyticsEvent.findMany()
    * ```
    */
  get analyticsEvent(): Prisma.AnalyticsEventDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.backupLog`: Exposes CRUD operations for the **BackupLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more BackupLogs
    * const backupLogs = await prisma.backupLog.findMany()
    * ```
    */
  get backupLog(): Prisma.BackupLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.customer`: Exposes CRUD operations for the **Customer** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Customers
    * const customers = await prisma.customer.findMany()
    * ```
    */
  get customer(): Prisma.CustomerDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.customerNote`: Exposes CRUD operations for the **CustomerNote** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CustomerNotes
    * const customerNotes = await prisma.customerNote.findMany()
    * ```
    */
  get customerNote(): Prisma.CustomerNoteDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.customerMessage`: Exposes CRUD operations for the **CustomerMessage** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more CustomerMessages
    * const customerMessages = await prisma.customerMessage.findMany()
    * ```
    */
  get customerMessage(): Prisma.CustomerMessageDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.2
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Inquiry: 'Inquiry',
    DraftProposal: 'DraftProposal',
    WebhookLog: 'WebhookLog',
    AdminSession: 'AdminSession',
    Subscriber: 'Subscriber',
    Post: 'Post',
    Testimonial: 'Testimonial',
    EmailLog: 'EmailLog',
    EmailProviderConfig: 'EmailProviderConfig',
    ReceivedEmail: 'ReceivedEmail',
    Invoice: 'Invoice',
    EventRecord: 'EventRecord',
    WhatsAppMessage: 'WhatsAppMessage',
    AnalyticsEvent: 'AnalyticsEvent',
    BackupLog: 'BackupLog',
    Customer: 'Customer',
    CustomerNote: 'CustomerNote',
    CustomerMessage: 'CustomerMessage'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "inquiry" | "draftProposal" | "webhookLog" | "adminSession" | "subscriber" | "post" | "testimonial" | "emailLog" | "emailProviderConfig" | "receivedEmail" | "invoice" | "eventRecord" | "whatsAppMessage" | "analyticsEvent" | "backupLog" | "customer" | "customerNote" | "customerMessage"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Inquiry: {
        payload: Prisma.$InquiryPayload<ExtArgs>
        fields: Prisma.InquiryFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InquiryFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InquiryFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          findFirst: {
            args: Prisma.InquiryFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InquiryFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          findMany: {
            args: Prisma.InquiryFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>[]
          }
          create: {
            args: Prisma.InquiryCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          createMany: {
            args: Prisma.InquiryCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InquiryCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>[]
          }
          delete: {
            args: Prisma.InquiryDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          update: {
            args: Prisma.InquiryUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          deleteMany: {
            args: Prisma.InquiryDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InquiryUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InquiryUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>[]
          }
          upsert: {
            args: Prisma.InquiryUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InquiryPayload>
          }
          aggregate: {
            args: Prisma.InquiryAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInquiry>
          }
          groupBy: {
            args: Prisma.InquiryGroupByArgs<ExtArgs>
            result: $Utils.Optional<InquiryGroupByOutputType>[]
          }
          count: {
            args: Prisma.InquiryCountArgs<ExtArgs>
            result: $Utils.Optional<InquiryCountAggregateOutputType> | number
          }
        }
      }
      DraftProposal: {
        payload: Prisma.$DraftProposalPayload<ExtArgs>
        fields: Prisma.DraftProposalFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DraftProposalFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DraftProposalFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload>
          }
          findFirst: {
            args: Prisma.DraftProposalFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DraftProposalFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload>
          }
          findMany: {
            args: Prisma.DraftProposalFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload>[]
          }
          create: {
            args: Prisma.DraftProposalCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload>
          }
          createMany: {
            args: Prisma.DraftProposalCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DraftProposalCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload>[]
          }
          delete: {
            args: Prisma.DraftProposalDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload>
          }
          update: {
            args: Prisma.DraftProposalUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload>
          }
          deleteMany: {
            args: Prisma.DraftProposalDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DraftProposalUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DraftProposalUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload>[]
          }
          upsert: {
            args: Prisma.DraftProposalUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DraftProposalPayload>
          }
          aggregate: {
            args: Prisma.DraftProposalAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDraftProposal>
          }
          groupBy: {
            args: Prisma.DraftProposalGroupByArgs<ExtArgs>
            result: $Utils.Optional<DraftProposalGroupByOutputType>[]
          }
          count: {
            args: Prisma.DraftProposalCountArgs<ExtArgs>
            result: $Utils.Optional<DraftProposalCountAggregateOutputType> | number
          }
        }
      }
      WebhookLog: {
        payload: Prisma.$WebhookLogPayload<ExtArgs>
        fields: Prisma.WebhookLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WebhookLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WebhookLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload>
          }
          findFirst: {
            args: Prisma.WebhookLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WebhookLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload>
          }
          findMany: {
            args: Prisma.WebhookLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload>[]
          }
          create: {
            args: Prisma.WebhookLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload>
          }
          createMany: {
            args: Prisma.WebhookLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WebhookLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload>[]
          }
          delete: {
            args: Prisma.WebhookLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload>
          }
          update: {
            args: Prisma.WebhookLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload>
          }
          deleteMany: {
            args: Prisma.WebhookLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WebhookLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WebhookLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload>[]
          }
          upsert: {
            args: Prisma.WebhookLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WebhookLogPayload>
          }
          aggregate: {
            args: Prisma.WebhookLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWebhookLog>
          }
          groupBy: {
            args: Prisma.WebhookLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<WebhookLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.WebhookLogCountArgs<ExtArgs>
            result: $Utils.Optional<WebhookLogCountAggregateOutputType> | number
          }
        }
      }
      AdminSession: {
        payload: Prisma.$AdminSessionPayload<ExtArgs>
        fields: Prisma.AdminSessionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AdminSessionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AdminSessionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          findFirst: {
            args: Prisma.AdminSessionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AdminSessionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          findMany: {
            args: Prisma.AdminSessionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>[]
          }
          create: {
            args: Prisma.AdminSessionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          createMany: {
            args: Prisma.AdminSessionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AdminSessionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>[]
          }
          delete: {
            args: Prisma.AdminSessionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          update: {
            args: Prisma.AdminSessionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          deleteMany: {
            args: Prisma.AdminSessionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AdminSessionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AdminSessionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>[]
          }
          upsert: {
            args: Prisma.AdminSessionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AdminSessionPayload>
          }
          aggregate: {
            args: Prisma.AdminSessionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAdminSession>
          }
          groupBy: {
            args: Prisma.AdminSessionGroupByArgs<ExtArgs>
            result: $Utils.Optional<AdminSessionGroupByOutputType>[]
          }
          count: {
            args: Prisma.AdminSessionCountArgs<ExtArgs>
            result: $Utils.Optional<AdminSessionCountAggregateOutputType> | number
          }
        }
      }
      Subscriber: {
        payload: Prisma.$SubscriberPayload<ExtArgs>
        fields: Prisma.SubscriberFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SubscriberFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SubscriberFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload>
          }
          findFirst: {
            args: Prisma.SubscriberFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SubscriberFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload>
          }
          findMany: {
            args: Prisma.SubscriberFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload>[]
          }
          create: {
            args: Prisma.SubscriberCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload>
          }
          createMany: {
            args: Prisma.SubscriberCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SubscriberCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload>[]
          }
          delete: {
            args: Prisma.SubscriberDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload>
          }
          update: {
            args: Prisma.SubscriberUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload>
          }
          deleteMany: {
            args: Prisma.SubscriberDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SubscriberUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SubscriberUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload>[]
          }
          upsert: {
            args: Prisma.SubscriberUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SubscriberPayload>
          }
          aggregate: {
            args: Prisma.SubscriberAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSubscriber>
          }
          groupBy: {
            args: Prisma.SubscriberGroupByArgs<ExtArgs>
            result: $Utils.Optional<SubscriberGroupByOutputType>[]
          }
          count: {
            args: Prisma.SubscriberCountArgs<ExtArgs>
            result: $Utils.Optional<SubscriberCountAggregateOutputType> | number
          }
        }
      }
      Post: {
        payload: Prisma.$PostPayload<ExtArgs>
        fields: Prisma.PostFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PostFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PostFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findFirst: {
            args: Prisma.PostFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PostFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          findMany: {
            args: Prisma.PostFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          create: {
            args: Prisma.PostCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          createMany: {
            args: Prisma.PostCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PostCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          delete: {
            args: Prisma.PostDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          update: {
            args: Prisma.PostUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          deleteMany: {
            args: Prisma.PostDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PostUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PostUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>[]
          }
          upsert: {
            args: Prisma.PostUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PostPayload>
          }
          aggregate: {
            args: Prisma.PostAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePost>
          }
          groupBy: {
            args: Prisma.PostGroupByArgs<ExtArgs>
            result: $Utils.Optional<PostGroupByOutputType>[]
          }
          count: {
            args: Prisma.PostCountArgs<ExtArgs>
            result: $Utils.Optional<PostCountAggregateOutputType> | number
          }
        }
      }
      Testimonial: {
        payload: Prisma.$TestimonialPayload<ExtArgs>
        fields: Prisma.TestimonialFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TestimonialFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TestimonialFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload>
          }
          findFirst: {
            args: Prisma.TestimonialFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TestimonialFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload>
          }
          findMany: {
            args: Prisma.TestimonialFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload>[]
          }
          create: {
            args: Prisma.TestimonialCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload>
          }
          createMany: {
            args: Prisma.TestimonialCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TestimonialCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload>[]
          }
          delete: {
            args: Prisma.TestimonialDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload>
          }
          update: {
            args: Prisma.TestimonialUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload>
          }
          deleteMany: {
            args: Prisma.TestimonialDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TestimonialUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TestimonialUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload>[]
          }
          upsert: {
            args: Prisma.TestimonialUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TestimonialPayload>
          }
          aggregate: {
            args: Prisma.TestimonialAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTestimonial>
          }
          groupBy: {
            args: Prisma.TestimonialGroupByArgs<ExtArgs>
            result: $Utils.Optional<TestimonialGroupByOutputType>[]
          }
          count: {
            args: Prisma.TestimonialCountArgs<ExtArgs>
            result: $Utils.Optional<TestimonialCountAggregateOutputType> | number
          }
        }
      }
      EmailLog: {
        payload: Prisma.$EmailLogPayload<ExtArgs>
        fields: Prisma.EmailLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EmailLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EmailLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          findFirst: {
            args: Prisma.EmailLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EmailLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          findMany: {
            args: Prisma.EmailLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>[]
          }
          create: {
            args: Prisma.EmailLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          createMany: {
            args: Prisma.EmailLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EmailLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>[]
          }
          delete: {
            args: Prisma.EmailLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          update: {
            args: Prisma.EmailLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          deleteMany: {
            args: Prisma.EmailLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EmailLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EmailLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>[]
          }
          upsert: {
            args: Prisma.EmailLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailLogPayload>
          }
          aggregate: {
            args: Prisma.EmailLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEmailLog>
          }
          groupBy: {
            args: Prisma.EmailLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<EmailLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.EmailLogCountArgs<ExtArgs>
            result: $Utils.Optional<EmailLogCountAggregateOutputType> | number
          }
        }
      }
      EmailProviderConfig: {
        payload: Prisma.$EmailProviderConfigPayload<ExtArgs>
        fields: Prisma.EmailProviderConfigFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EmailProviderConfigFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EmailProviderConfigFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload>
          }
          findFirst: {
            args: Prisma.EmailProviderConfigFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EmailProviderConfigFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload>
          }
          findMany: {
            args: Prisma.EmailProviderConfigFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload>[]
          }
          create: {
            args: Prisma.EmailProviderConfigCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload>
          }
          createMany: {
            args: Prisma.EmailProviderConfigCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EmailProviderConfigCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload>[]
          }
          delete: {
            args: Prisma.EmailProviderConfigDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload>
          }
          update: {
            args: Prisma.EmailProviderConfigUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload>
          }
          deleteMany: {
            args: Prisma.EmailProviderConfigDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EmailProviderConfigUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EmailProviderConfigUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload>[]
          }
          upsert: {
            args: Prisma.EmailProviderConfigUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EmailProviderConfigPayload>
          }
          aggregate: {
            args: Prisma.EmailProviderConfigAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEmailProviderConfig>
          }
          groupBy: {
            args: Prisma.EmailProviderConfigGroupByArgs<ExtArgs>
            result: $Utils.Optional<EmailProviderConfigGroupByOutputType>[]
          }
          count: {
            args: Prisma.EmailProviderConfigCountArgs<ExtArgs>
            result: $Utils.Optional<EmailProviderConfigCountAggregateOutputType> | number
          }
        }
      }
      ReceivedEmail: {
        payload: Prisma.$ReceivedEmailPayload<ExtArgs>
        fields: Prisma.ReceivedEmailFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReceivedEmailFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReceivedEmailFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload>
          }
          findFirst: {
            args: Prisma.ReceivedEmailFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReceivedEmailFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload>
          }
          findMany: {
            args: Prisma.ReceivedEmailFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload>[]
          }
          create: {
            args: Prisma.ReceivedEmailCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload>
          }
          createMany: {
            args: Prisma.ReceivedEmailCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReceivedEmailCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload>[]
          }
          delete: {
            args: Prisma.ReceivedEmailDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload>
          }
          update: {
            args: Prisma.ReceivedEmailUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload>
          }
          deleteMany: {
            args: Prisma.ReceivedEmailDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReceivedEmailUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ReceivedEmailUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload>[]
          }
          upsert: {
            args: Prisma.ReceivedEmailUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReceivedEmailPayload>
          }
          aggregate: {
            args: Prisma.ReceivedEmailAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReceivedEmail>
          }
          groupBy: {
            args: Prisma.ReceivedEmailGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReceivedEmailGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReceivedEmailCountArgs<ExtArgs>
            result: $Utils.Optional<ReceivedEmailCountAggregateOutputType> | number
          }
        }
      }
      Invoice: {
        payload: Prisma.$InvoicePayload<ExtArgs>
        fields: Prisma.InvoiceFieldRefs
        operations: {
          findUnique: {
            args: Prisma.InvoiceFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.InvoiceFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          findFirst: {
            args: Prisma.InvoiceFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.InvoiceFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          findMany: {
            args: Prisma.InvoiceFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          create: {
            args: Prisma.InvoiceCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          createMany: {
            args: Prisma.InvoiceCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.InvoiceCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          delete: {
            args: Prisma.InvoiceDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          update: {
            args: Prisma.InvoiceUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          deleteMany: {
            args: Prisma.InvoiceDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.InvoiceUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.InvoiceUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>[]
          }
          upsert: {
            args: Prisma.InvoiceUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$InvoicePayload>
          }
          aggregate: {
            args: Prisma.InvoiceAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateInvoice>
          }
          groupBy: {
            args: Prisma.InvoiceGroupByArgs<ExtArgs>
            result: $Utils.Optional<InvoiceGroupByOutputType>[]
          }
          count: {
            args: Prisma.InvoiceCountArgs<ExtArgs>
            result: $Utils.Optional<InvoiceCountAggregateOutputType> | number
          }
        }
      }
      EventRecord: {
        payload: Prisma.$EventRecordPayload<ExtArgs>
        fields: Prisma.EventRecordFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EventRecordFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EventRecordFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload>
          }
          findFirst: {
            args: Prisma.EventRecordFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EventRecordFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload>
          }
          findMany: {
            args: Prisma.EventRecordFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload>[]
          }
          create: {
            args: Prisma.EventRecordCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload>
          }
          createMany: {
            args: Prisma.EventRecordCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.EventRecordCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload>[]
          }
          delete: {
            args: Prisma.EventRecordDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload>
          }
          update: {
            args: Prisma.EventRecordUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload>
          }
          deleteMany: {
            args: Prisma.EventRecordDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EventRecordUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.EventRecordUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload>[]
          }
          upsert: {
            args: Prisma.EventRecordUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EventRecordPayload>
          }
          aggregate: {
            args: Prisma.EventRecordAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEventRecord>
          }
          groupBy: {
            args: Prisma.EventRecordGroupByArgs<ExtArgs>
            result: $Utils.Optional<EventRecordGroupByOutputType>[]
          }
          count: {
            args: Prisma.EventRecordCountArgs<ExtArgs>
            result: $Utils.Optional<EventRecordCountAggregateOutputType> | number
          }
        }
      }
      WhatsAppMessage: {
        payload: Prisma.$WhatsAppMessagePayload<ExtArgs>
        fields: Prisma.WhatsAppMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WhatsAppMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WhatsAppMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload>
          }
          findFirst: {
            args: Prisma.WhatsAppMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WhatsAppMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload>
          }
          findMany: {
            args: Prisma.WhatsAppMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload>[]
          }
          create: {
            args: Prisma.WhatsAppMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload>
          }
          createMany: {
            args: Prisma.WhatsAppMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WhatsAppMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload>[]
          }
          delete: {
            args: Prisma.WhatsAppMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload>
          }
          update: {
            args: Prisma.WhatsAppMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload>
          }
          deleteMany: {
            args: Prisma.WhatsAppMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WhatsAppMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WhatsAppMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload>[]
          }
          upsert: {
            args: Prisma.WhatsAppMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WhatsAppMessagePayload>
          }
          aggregate: {
            args: Prisma.WhatsAppMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWhatsAppMessage>
          }
          groupBy: {
            args: Prisma.WhatsAppMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<WhatsAppMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.WhatsAppMessageCountArgs<ExtArgs>
            result: $Utils.Optional<WhatsAppMessageCountAggregateOutputType> | number
          }
        }
      }
      AnalyticsEvent: {
        payload: Prisma.$AnalyticsEventPayload<ExtArgs>
        fields: Prisma.AnalyticsEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AnalyticsEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AnalyticsEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload>
          }
          findFirst: {
            args: Prisma.AnalyticsEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AnalyticsEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload>
          }
          findMany: {
            args: Prisma.AnalyticsEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload>[]
          }
          create: {
            args: Prisma.AnalyticsEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload>
          }
          createMany: {
            args: Prisma.AnalyticsEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AnalyticsEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload>[]
          }
          delete: {
            args: Prisma.AnalyticsEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload>
          }
          update: {
            args: Prisma.AnalyticsEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload>
          }
          deleteMany: {
            args: Prisma.AnalyticsEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AnalyticsEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AnalyticsEventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload>[]
          }
          upsert: {
            args: Prisma.AnalyticsEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AnalyticsEventPayload>
          }
          aggregate: {
            args: Prisma.AnalyticsEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAnalyticsEvent>
          }
          groupBy: {
            args: Prisma.AnalyticsEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<AnalyticsEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.AnalyticsEventCountArgs<ExtArgs>
            result: $Utils.Optional<AnalyticsEventCountAggregateOutputType> | number
          }
        }
      }
      BackupLog: {
        payload: Prisma.$BackupLogPayload<ExtArgs>
        fields: Prisma.BackupLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BackupLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BackupLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload>
          }
          findFirst: {
            args: Prisma.BackupLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BackupLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload>
          }
          findMany: {
            args: Prisma.BackupLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload>[]
          }
          create: {
            args: Prisma.BackupLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload>
          }
          createMany: {
            args: Prisma.BackupLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.BackupLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload>[]
          }
          delete: {
            args: Prisma.BackupLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload>
          }
          update: {
            args: Prisma.BackupLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload>
          }
          deleteMany: {
            args: Prisma.BackupLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BackupLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.BackupLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload>[]
          }
          upsert: {
            args: Prisma.BackupLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BackupLogPayload>
          }
          aggregate: {
            args: Prisma.BackupLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBackupLog>
          }
          groupBy: {
            args: Prisma.BackupLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<BackupLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.BackupLogCountArgs<ExtArgs>
            result: $Utils.Optional<BackupLogCountAggregateOutputType> | number
          }
        }
      }
      Customer: {
        payload: Prisma.$CustomerPayload<ExtArgs>
        fields: Prisma.CustomerFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CustomerFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CustomerFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          findFirst: {
            args: Prisma.CustomerFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CustomerFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          findMany: {
            args: Prisma.CustomerFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>[]
          }
          create: {
            args: Prisma.CustomerCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          createMany: {
            args: Prisma.CustomerCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CustomerCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>[]
          }
          delete: {
            args: Prisma.CustomerDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          update: {
            args: Prisma.CustomerUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          deleteMany: {
            args: Prisma.CustomerDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CustomerUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CustomerUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>[]
          }
          upsert: {
            args: Prisma.CustomerUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerPayload>
          }
          aggregate: {
            args: Prisma.CustomerAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCustomer>
          }
          groupBy: {
            args: Prisma.CustomerGroupByArgs<ExtArgs>
            result: $Utils.Optional<CustomerGroupByOutputType>[]
          }
          count: {
            args: Prisma.CustomerCountArgs<ExtArgs>
            result: $Utils.Optional<CustomerCountAggregateOutputType> | number
          }
        }
      }
      CustomerNote: {
        payload: Prisma.$CustomerNotePayload<ExtArgs>
        fields: Prisma.CustomerNoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CustomerNoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CustomerNoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload>
          }
          findFirst: {
            args: Prisma.CustomerNoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CustomerNoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload>
          }
          findMany: {
            args: Prisma.CustomerNoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload>[]
          }
          create: {
            args: Prisma.CustomerNoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload>
          }
          createMany: {
            args: Prisma.CustomerNoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CustomerNoteCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload>[]
          }
          delete: {
            args: Prisma.CustomerNoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload>
          }
          update: {
            args: Prisma.CustomerNoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload>
          }
          deleteMany: {
            args: Prisma.CustomerNoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CustomerNoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CustomerNoteUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload>[]
          }
          upsert: {
            args: Prisma.CustomerNoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerNotePayload>
          }
          aggregate: {
            args: Prisma.CustomerNoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCustomerNote>
          }
          groupBy: {
            args: Prisma.CustomerNoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<CustomerNoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.CustomerNoteCountArgs<ExtArgs>
            result: $Utils.Optional<CustomerNoteCountAggregateOutputType> | number
          }
        }
      }
      CustomerMessage: {
        payload: Prisma.$CustomerMessagePayload<ExtArgs>
        fields: Prisma.CustomerMessageFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CustomerMessageFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CustomerMessageFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload>
          }
          findFirst: {
            args: Prisma.CustomerMessageFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CustomerMessageFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload>
          }
          findMany: {
            args: Prisma.CustomerMessageFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload>[]
          }
          create: {
            args: Prisma.CustomerMessageCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload>
          }
          createMany: {
            args: Prisma.CustomerMessageCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CustomerMessageCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload>[]
          }
          delete: {
            args: Prisma.CustomerMessageDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload>
          }
          update: {
            args: Prisma.CustomerMessageUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload>
          }
          deleteMany: {
            args: Prisma.CustomerMessageDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CustomerMessageUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CustomerMessageUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload>[]
          }
          upsert: {
            args: Prisma.CustomerMessageUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CustomerMessagePayload>
          }
          aggregate: {
            args: Prisma.CustomerMessageAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCustomerMessage>
          }
          groupBy: {
            args: Prisma.CustomerMessageGroupByArgs<ExtArgs>
            result: $Utils.Optional<CustomerMessageGroupByOutputType>[]
          }
          count: {
            args: Prisma.CustomerMessageCountArgs<ExtArgs>
            result: $Utils.Optional<CustomerMessageCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    inquiry?: InquiryOmit
    draftProposal?: DraftProposalOmit
    webhookLog?: WebhookLogOmit
    adminSession?: AdminSessionOmit
    subscriber?: SubscriberOmit
    post?: PostOmit
    testimonial?: TestimonialOmit
    emailLog?: EmailLogOmit
    emailProviderConfig?: EmailProviderConfigOmit
    receivedEmail?: ReceivedEmailOmit
    invoice?: InvoiceOmit
    eventRecord?: EventRecordOmit
    whatsAppMessage?: WhatsAppMessageOmit
    analyticsEvent?: AnalyticsEventOmit
    backupLog?: BackupLogOmit
    customer?: CustomerOmit
    customerNote?: CustomerNoteOmit
    customerMessage?: CustomerMessageOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */



  /**
   * Models
   */

  /**
   * Model Inquiry
   */

  export type AggregateInquiry = {
    _count: InquiryCountAggregateOutputType | null
    _min: InquiryMinAggregateOutputType | null
    _max: InquiryMaxAggregateOutputType | null
  }

  export type InquiryMinAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    phone: string | null
    whatsapp: string | null
    service: string | null
    addlService: string | null
    budget: string | null
    message: string | null
    status: string | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InquiryMaxAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    phone: string | null
    whatsapp: string | null
    service: string | null
    addlService: string | null
    budget: string | null
    message: string | null
    status: string | null
    source: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InquiryCountAggregateOutputType = {
    id: number
    name: number
    email: number
    phone: number
    whatsapp: number
    service: number
    addlService: number
    budget: number
    message: number
    status: number
    source: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type InquiryMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    phone?: true
    whatsapp?: true
    service?: true
    addlService?: true
    budget?: true
    message?: true
    status?: true
    source?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InquiryMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    phone?: true
    whatsapp?: true
    service?: true
    addlService?: true
    budget?: true
    message?: true
    status?: true
    source?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InquiryCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    phone?: true
    whatsapp?: true
    service?: true
    addlService?: true
    budget?: true
    message?: true
    status?: true
    source?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InquiryAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Inquiry to aggregate.
     */
    where?: InquiryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inquiries to fetch.
     */
    orderBy?: InquiryOrderByWithRelationInput | InquiryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InquiryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inquiries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inquiries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Inquiries
    **/
    _count?: true | InquiryCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InquiryMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InquiryMaxAggregateInputType
  }

  export type GetInquiryAggregateType<T extends InquiryAggregateArgs> = {
        [P in keyof T & keyof AggregateInquiry]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInquiry[P]>
      : GetScalarType<T[P], AggregateInquiry[P]>
  }




  export type InquiryGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InquiryWhereInput
    orderBy?: InquiryOrderByWithAggregationInput | InquiryOrderByWithAggregationInput[]
    by: InquiryScalarFieldEnum[] | InquiryScalarFieldEnum
    having?: InquiryScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InquiryCountAggregateInputType | true
    _min?: InquiryMinAggregateInputType
    _max?: InquiryMaxAggregateInputType
  }

  export type InquiryGroupByOutputType = {
    id: string
    name: string
    email: string
    phone: string | null
    whatsapp: string | null
    service: string
    addlService: string | null
    budget: string | null
    message: string
    status: string
    source: string
    createdAt: Date
    updatedAt: Date
    _count: InquiryCountAggregateOutputType | null
    _min: InquiryMinAggregateOutputType | null
    _max: InquiryMaxAggregateOutputType | null
  }

  type GetInquiryGroupByPayload<T extends InquiryGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InquiryGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InquiryGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InquiryGroupByOutputType[P]>
            : GetScalarType<T[P], InquiryGroupByOutputType[P]>
        }
      >
    >


  export type InquirySelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    whatsapp?: boolean
    service?: boolean
    addlService?: boolean
    budget?: boolean
    message?: boolean
    status?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["inquiry"]>

  export type InquirySelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    whatsapp?: boolean
    service?: boolean
    addlService?: boolean
    budget?: boolean
    message?: boolean
    status?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["inquiry"]>

  export type InquirySelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    whatsapp?: boolean
    service?: boolean
    addlService?: boolean
    budget?: boolean
    message?: boolean
    status?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["inquiry"]>

  export type InquirySelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    whatsapp?: boolean
    service?: boolean
    addlService?: boolean
    budget?: boolean
    message?: boolean
    status?: boolean
    source?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type InquiryOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "phone" | "whatsapp" | "service" | "addlService" | "budget" | "message" | "status" | "source" | "createdAt" | "updatedAt", ExtArgs["result"]["inquiry"]>

  export type $InquiryPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Inquiry"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      email: string
      phone: string | null
      whatsapp: string | null
      service: string
      addlService: string | null
      budget: string | null
      message: string
      status: string
      source: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["inquiry"]>
    composites: {}
  }

  type InquiryGetPayload<S extends boolean | null | undefined | InquiryDefaultArgs> = $Result.GetResult<Prisma.$InquiryPayload, S>

  type InquiryCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InquiryFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InquiryCountAggregateInputType | true
    }

  export interface InquiryDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Inquiry'], meta: { name: 'Inquiry' } }
    /**
     * Find zero or one Inquiry that matches the filter.
     * @param {InquiryFindUniqueArgs} args - Arguments to find a Inquiry
     * @example
     * // Get one Inquiry
     * const inquiry = await prisma.inquiry.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InquiryFindUniqueArgs>(args: SelectSubset<T, InquiryFindUniqueArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Inquiry that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InquiryFindUniqueOrThrowArgs} args - Arguments to find a Inquiry
     * @example
     * // Get one Inquiry
     * const inquiry = await prisma.inquiry.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InquiryFindUniqueOrThrowArgs>(args: SelectSubset<T, InquiryFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Inquiry that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryFindFirstArgs} args - Arguments to find a Inquiry
     * @example
     * // Get one Inquiry
     * const inquiry = await prisma.inquiry.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InquiryFindFirstArgs>(args?: SelectSubset<T, InquiryFindFirstArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Inquiry that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryFindFirstOrThrowArgs} args - Arguments to find a Inquiry
     * @example
     * // Get one Inquiry
     * const inquiry = await prisma.inquiry.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InquiryFindFirstOrThrowArgs>(args?: SelectSubset<T, InquiryFindFirstOrThrowArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Inquiries that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Inquiries
     * const inquiries = await prisma.inquiry.findMany()
     * 
     * // Get first 10 Inquiries
     * const inquiries = await prisma.inquiry.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const inquiryWithIdOnly = await prisma.inquiry.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InquiryFindManyArgs>(args?: SelectSubset<T, InquiryFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Inquiry.
     * @param {InquiryCreateArgs} args - Arguments to create a Inquiry.
     * @example
     * // Create one Inquiry
     * const Inquiry = await prisma.inquiry.create({
     *   data: {
     *     // ... data to create a Inquiry
     *   }
     * })
     * 
     */
    create<T extends InquiryCreateArgs>(args: SelectSubset<T, InquiryCreateArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Inquiries.
     * @param {InquiryCreateManyArgs} args - Arguments to create many Inquiries.
     * @example
     * // Create many Inquiries
     * const inquiry = await prisma.inquiry.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InquiryCreateManyArgs>(args?: SelectSubset<T, InquiryCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Inquiries and returns the data saved in the database.
     * @param {InquiryCreateManyAndReturnArgs} args - Arguments to create many Inquiries.
     * @example
     * // Create many Inquiries
     * const inquiry = await prisma.inquiry.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Inquiries and only return the `id`
     * const inquiryWithIdOnly = await prisma.inquiry.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InquiryCreateManyAndReturnArgs>(args?: SelectSubset<T, InquiryCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Inquiry.
     * @param {InquiryDeleteArgs} args - Arguments to delete one Inquiry.
     * @example
     * // Delete one Inquiry
     * const Inquiry = await prisma.inquiry.delete({
     *   where: {
     *     // ... filter to delete one Inquiry
     *   }
     * })
     * 
     */
    delete<T extends InquiryDeleteArgs>(args: SelectSubset<T, InquiryDeleteArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Inquiry.
     * @param {InquiryUpdateArgs} args - Arguments to update one Inquiry.
     * @example
     * // Update one Inquiry
     * const inquiry = await prisma.inquiry.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InquiryUpdateArgs>(args: SelectSubset<T, InquiryUpdateArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Inquiries.
     * @param {InquiryDeleteManyArgs} args - Arguments to filter Inquiries to delete.
     * @example
     * // Delete a few Inquiries
     * const { count } = await prisma.inquiry.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InquiryDeleteManyArgs>(args?: SelectSubset<T, InquiryDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Inquiries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Inquiries
     * const inquiry = await prisma.inquiry.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InquiryUpdateManyArgs>(args: SelectSubset<T, InquiryUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Inquiries and returns the data updated in the database.
     * @param {InquiryUpdateManyAndReturnArgs} args - Arguments to update many Inquiries.
     * @example
     * // Update many Inquiries
     * const inquiry = await prisma.inquiry.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Inquiries and only return the `id`
     * const inquiryWithIdOnly = await prisma.inquiry.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InquiryUpdateManyAndReturnArgs>(args: SelectSubset<T, InquiryUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Inquiry.
     * @param {InquiryUpsertArgs} args - Arguments to update or create a Inquiry.
     * @example
     * // Update or create a Inquiry
     * const inquiry = await prisma.inquiry.upsert({
     *   create: {
     *     // ... data to create a Inquiry
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Inquiry we want to update
     *   }
     * })
     */
    upsert<T extends InquiryUpsertArgs>(args: SelectSubset<T, InquiryUpsertArgs<ExtArgs>>): Prisma__InquiryClient<$Result.GetResult<Prisma.$InquiryPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Inquiries.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryCountArgs} args - Arguments to filter Inquiries to count.
     * @example
     * // Count the number of Inquiries
     * const count = await prisma.inquiry.count({
     *   where: {
     *     // ... the filter for the Inquiries we want to count
     *   }
     * })
    **/
    count<T extends InquiryCountArgs>(
      args?: Subset<T, InquiryCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InquiryCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Inquiry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InquiryAggregateArgs>(args: Subset<T, InquiryAggregateArgs>): Prisma.PrismaPromise<GetInquiryAggregateType<T>>

    /**
     * Group by Inquiry.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InquiryGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InquiryGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InquiryGroupByArgs['orderBy'] }
        : { orderBy?: InquiryGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InquiryGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInquiryGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Inquiry model
   */
  readonly fields: InquiryFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Inquiry.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InquiryClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Inquiry model
   */
  interface InquiryFieldRefs {
    readonly id: FieldRef<"Inquiry", 'String'>
    readonly name: FieldRef<"Inquiry", 'String'>
    readonly email: FieldRef<"Inquiry", 'String'>
    readonly phone: FieldRef<"Inquiry", 'String'>
    readonly whatsapp: FieldRef<"Inquiry", 'String'>
    readonly service: FieldRef<"Inquiry", 'String'>
    readonly addlService: FieldRef<"Inquiry", 'String'>
    readonly budget: FieldRef<"Inquiry", 'String'>
    readonly message: FieldRef<"Inquiry", 'String'>
    readonly status: FieldRef<"Inquiry", 'String'>
    readonly source: FieldRef<"Inquiry", 'String'>
    readonly createdAt: FieldRef<"Inquiry", 'DateTime'>
    readonly updatedAt: FieldRef<"Inquiry", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Inquiry findUnique
   */
  export type InquiryFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Filter, which Inquiry to fetch.
     */
    where: InquiryWhereUniqueInput
  }

  /**
   * Inquiry findUniqueOrThrow
   */
  export type InquiryFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Filter, which Inquiry to fetch.
     */
    where: InquiryWhereUniqueInput
  }

  /**
   * Inquiry findFirst
   */
  export type InquiryFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Filter, which Inquiry to fetch.
     */
    where?: InquiryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inquiries to fetch.
     */
    orderBy?: InquiryOrderByWithRelationInput | InquiryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Inquiries.
     */
    cursor?: InquiryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inquiries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inquiries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inquiries.
     */
    distinct?: InquiryScalarFieldEnum | InquiryScalarFieldEnum[]
  }

  /**
   * Inquiry findFirstOrThrow
   */
  export type InquiryFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Filter, which Inquiry to fetch.
     */
    where?: InquiryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inquiries to fetch.
     */
    orderBy?: InquiryOrderByWithRelationInput | InquiryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Inquiries.
     */
    cursor?: InquiryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inquiries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inquiries.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Inquiries.
     */
    distinct?: InquiryScalarFieldEnum | InquiryScalarFieldEnum[]
  }

  /**
   * Inquiry findMany
   */
  export type InquiryFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Filter, which Inquiries to fetch.
     */
    where?: InquiryWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Inquiries to fetch.
     */
    orderBy?: InquiryOrderByWithRelationInput | InquiryOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Inquiries.
     */
    cursor?: InquiryWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Inquiries from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Inquiries.
     */
    skip?: number
    distinct?: InquiryScalarFieldEnum | InquiryScalarFieldEnum[]
  }

  /**
   * Inquiry create
   */
  export type InquiryCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * The data needed to create a Inquiry.
     */
    data: XOR<InquiryCreateInput, InquiryUncheckedCreateInput>
  }

  /**
   * Inquiry createMany
   */
  export type InquiryCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Inquiries.
     */
    data: InquiryCreateManyInput | InquiryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Inquiry createManyAndReturn
   */
  export type InquiryCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * The data used to create many Inquiries.
     */
    data: InquiryCreateManyInput | InquiryCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Inquiry update
   */
  export type InquiryUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * The data needed to update a Inquiry.
     */
    data: XOR<InquiryUpdateInput, InquiryUncheckedUpdateInput>
    /**
     * Choose, which Inquiry to update.
     */
    where: InquiryWhereUniqueInput
  }

  /**
   * Inquiry updateMany
   */
  export type InquiryUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Inquiries.
     */
    data: XOR<InquiryUpdateManyMutationInput, InquiryUncheckedUpdateManyInput>
    /**
     * Filter which Inquiries to update
     */
    where?: InquiryWhereInput
    /**
     * Limit how many Inquiries to update.
     */
    limit?: number
  }

  /**
   * Inquiry updateManyAndReturn
   */
  export type InquiryUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * The data used to update Inquiries.
     */
    data: XOR<InquiryUpdateManyMutationInput, InquiryUncheckedUpdateManyInput>
    /**
     * Filter which Inquiries to update
     */
    where?: InquiryWhereInput
    /**
     * Limit how many Inquiries to update.
     */
    limit?: number
  }

  /**
   * Inquiry upsert
   */
  export type InquiryUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * The filter to search for the Inquiry to update in case it exists.
     */
    where: InquiryWhereUniqueInput
    /**
     * In case the Inquiry found by the `where` argument doesn't exist, create a new Inquiry with this data.
     */
    create: XOR<InquiryCreateInput, InquiryUncheckedCreateInput>
    /**
     * In case the Inquiry was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InquiryUpdateInput, InquiryUncheckedUpdateInput>
  }

  /**
   * Inquiry delete
   */
  export type InquiryDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
    /**
     * Filter which Inquiry to delete.
     */
    where: InquiryWhereUniqueInput
  }

  /**
   * Inquiry deleteMany
   */
  export type InquiryDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Inquiries to delete
     */
    where?: InquiryWhereInput
    /**
     * Limit how many Inquiries to delete.
     */
    limit?: number
  }

  /**
   * Inquiry without action
   */
  export type InquiryDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Inquiry
     */
    select?: InquirySelect<ExtArgs> | null
    /**
     * Omit specific fields from the Inquiry
     */
    omit?: InquiryOmit<ExtArgs> | null
  }


  /**
   * Model DraftProposal
   */

  export type AggregateDraftProposal = {
    _count: DraftProposalCountAggregateOutputType | null
    _avg: DraftProposalAvgAggregateOutputType | null
    _sum: DraftProposalSumAggregateOutputType | null
    _min: DraftProposalMinAggregateOutputType | null
    _max: DraftProposalMaxAggregateOutputType | null
  }

  export type DraftProposalAvgAggregateOutputType = {
    leadScore: number | null
  }

  export type DraftProposalSumAggregateOutputType = {
    leadScore: number | null
  }

  export type DraftProposalMinAggregateOutputType = {
    id: string | null
    source: string | null
    customerName: string | null
    customerEmail: string | null
    service: string | null
    leadScore: number | null
    inquiryId: string | null
    receivedEmailId: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DraftProposalMaxAggregateOutputType = {
    id: string | null
    source: string | null
    customerName: string | null
    customerEmail: string | null
    service: string | null
    leadScore: number | null
    inquiryId: string | null
    receivedEmailId: string | null
    status: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type DraftProposalCountAggregateOutputType = {
    id: number
    source: number
    customerName: number
    customerEmail: number
    service: number
    draftJson: number
    leadScore: number
    inquiryId: number
    receivedEmailId: number
    status: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type DraftProposalAvgAggregateInputType = {
    leadScore?: true
  }

  export type DraftProposalSumAggregateInputType = {
    leadScore?: true
  }

  export type DraftProposalMinAggregateInputType = {
    id?: true
    source?: true
    customerName?: true
    customerEmail?: true
    service?: true
    leadScore?: true
    inquiryId?: true
    receivedEmailId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DraftProposalMaxAggregateInputType = {
    id?: true
    source?: true
    customerName?: true
    customerEmail?: true
    service?: true
    leadScore?: true
    inquiryId?: true
    receivedEmailId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
  }

  export type DraftProposalCountAggregateInputType = {
    id?: true
    source?: true
    customerName?: true
    customerEmail?: true
    service?: true
    draftJson?: true
    leadScore?: true
    inquiryId?: true
    receivedEmailId?: true
    status?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type DraftProposalAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DraftProposal to aggregate.
     */
    where?: DraftProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DraftProposals to fetch.
     */
    orderBy?: DraftProposalOrderByWithRelationInput | DraftProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DraftProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DraftProposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DraftProposals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DraftProposals
    **/
    _count?: true | DraftProposalCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DraftProposalAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DraftProposalSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DraftProposalMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DraftProposalMaxAggregateInputType
  }

  export type GetDraftProposalAggregateType<T extends DraftProposalAggregateArgs> = {
        [P in keyof T & keyof AggregateDraftProposal]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDraftProposal[P]>
      : GetScalarType<T[P], AggregateDraftProposal[P]>
  }




  export type DraftProposalGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DraftProposalWhereInput
    orderBy?: DraftProposalOrderByWithAggregationInput | DraftProposalOrderByWithAggregationInput[]
    by: DraftProposalScalarFieldEnum[] | DraftProposalScalarFieldEnum
    having?: DraftProposalScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DraftProposalCountAggregateInputType | true
    _avg?: DraftProposalAvgAggregateInputType
    _sum?: DraftProposalSumAggregateInputType
    _min?: DraftProposalMinAggregateInputType
    _max?: DraftProposalMaxAggregateInputType
  }

  export type DraftProposalGroupByOutputType = {
    id: string
    source: string
    customerName: string
    customerEmail: string
    service: string
    draftJson: JsonValue
    leadScore: number | null
    inquiryId: string | null
    receivedEmailId: string | null
    status: string
    createdAt: Date
    updatedAt: Date
    _count: DraftProposalCountAggregateOutputType | null
    _avg: DraftProposalAvgAggregateOutputType | null
    _sum: DraftProposalSumAggregateOutputType | null
    _min: DraftProposalMinAggregateOutputType | null
    _max: DraftProposalMaxAggregateOutputType | null
  }

  type GetDraftProposalGroupByPayload<T extends DraftProposalGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DraftProposalGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DraftProposalGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DraftProposalGroupByOutputType[P]>
            : GetScalarType<T[P], DraftProposalGroupByOutputType[P]>
        }
      >
    >


  export type DraftProposalSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    customerName?: boolean
    customerEmail?: boolean
    service?: boolean
    draftJson?: boolean
    leadScore?: boolean
    inquiryId?: boolean
    receivedEmailId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["draftProposal"]>

  export type DraftProposalSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    customerName?: boolean
    customerEmail?: boolean
    service?: boolean
    draftJson?: boolean
    leadScore?: boolean
    inquiryId?: boolean
    receivedEmailId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["draftProposal"]>

  export type DraftProposalSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    customerName?: boolean
    customerEmail?: boolean
    service?: boolean
    draftJson?: boolean
    leadScore?: boolean
    inquiryId?: boolean
    receivedEmailId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["draftProposal"]>

  export type DraftProposalSelectScalar = {
    id?: boolean
    source?: boolean
    customerName?: boolean
    customerEmail?: boolean
    service?: boolean
    draftJson?: boolean
    leadScore?: boolean
    inquiryId?: boolean
    receivedEmailId?: boolean
    status?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type DraftProposalOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "source" | "customerName" | "customerEmail" | "service" | "draftJson" | "leadScore" | "inquiryId" | "receivedEmailId" | "status" | "createdAt" | "updatedAt", ExtArgs["result"]["draftProposal"]>

  export type $DraftProposalPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DraftProposal"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      source: string
      customerName: string
      customerEmail: string
      service: string
      draftJson: Prisma.JsonValue
      leadScore: number | null
      inquiryId: string | null
      receivedEmailId: string | null
      status: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["draftProposal"]>
    composites: {}
  }

  type DraftProposalGetPayload<S extends boolean | null | undefined | DraftProposalDefaultArgs> = $Result.GetResult<Prisma.$DraftProposalPayload, S>

  type DraftProposalCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DraftProposalFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: DraftProposalCountAggregateInputType | true
    }

  export interface DraftProposalDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DraftProposal'], meta: { name: 'DraftProposal' } }
    /**
     * Find zero or one DraftProposal that matches the filter.
     * @param {DraftProposalFindUniqueArgs} args - Arguments to find a DraftProposal
     * @example
     * // Get one DraftProposal
     * const draftProposal = await prisma.draftProposal.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DraftProposalFindUniqueArgs>(args: SelectSubset<T, DraftProposalFindUniqueArgs<ExtArgs>>): Prisma__DraftProposalClient<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one DraftProposal that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DraftProposalFindUniqueOrThrowArgs} args - Arguments to find a DraftProposal
     * @example
     * // Get one DraftProposal
     * const draftProposal = await prisma.draftProposal.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DraftProposalFindUniqueOrThrowArgs>(args: SelectSubset<T, DraftProposalFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DraftProposalClient<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DraftProposal that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DraftProposalFindFirstArgs} args - Arguments to find a DraftProposal
     * @example
     * // Get one DraftProposal
     * const draftProposal = await prisma.draftProposal.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DraftProposalFindFirstArgs>(args?: SelectSubset<T, DraftProposalFindFirstArgs<ExtArgs>>): Prisma__DraftProposalClient<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DraftProposal that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DraftProposalFindFirstOrThrowArgs} args - Arguments to find a DraftProposal
     * @example
     * // Get one DraftProposal
     * const draftProposal = await prisma.draftProposal.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DraftProposalFindFirstOrThrowArgs>(args?: SelectSubset<T, DraftProposalFindFirstOrThrowArgs<ExtArgs>>): Prisma__DraftProposalClient<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more DraftProposals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DraftProposalFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DraftProposals
     * const draftProposals = await prisma.draftProposal.findMany()
     * 
     * // Get first 10 DraftProposals
     * const draftProposals = await prisma.draftProposal.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const draftProposalWithIdOnly = await prisma.draftProposal.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DraftProposalFindManyArgs>(args?: SelectSubset<T, DraftProposalFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a DraftProposal.
     * @param {DraftProposalCreateArgs} args - Arguments to create a DraftProposal.
     * @example
     * // Create one DraftProposal
     * const DraftProposal = await prisma.draftProposal.create({
     *   data: {
     *     // ... data to create a DraftProposal
     *   }
     * })
     * 
     */
    create<T extends DraftProposalCreateArgs>(args: SelectSubset<T, DraftProposalCreateArgs<ExtArgs>>): Prisma__DraftProposalClient<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many DraftProposals.
     * @param {DraftProposalCreateManyArgs} args - Arguments to create many DraftProposals.
     * @example
     * // Create many DraftProposals
     * const draftProposal = await prisma.draftProposal.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DraftProposalCreateManyArgs>(args?: SelectSubset<T, DraftProposalCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DraftProposals and returns the data saved in the database.
     * @param {DraftProposalCreateManyAndReturnArgs} args - Arguments to create many DraftProposals.
     * @example
     * // Create many DraftProposals
     * const draftProposal = await prisma.draftProposal.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DraftProposals and only return the `id`
     * const draftProposalWithIdOnly = await prisma.draftProposal.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DraftProposalCreateManyAndReturnArgs>(args?: SelectSubset<T, DraftProposalCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a DraftProposal.
     * @param {DraftProposalDeleteArgs} args - Arguments to delete one DraftProposal.
     * @example
     * // Delete one DraftProposal
     * const DraftProposal = await prisma.draftProposal.delete({
     *   where: {
     *     // ... filter to delete one DraftProposal
     *   }
     * })
     * 
     */
    delete<T extends DraftProposalDeleteArgs>(args: SelectSubset<T, DraftProposalDeleteArgs<ExtArgs>>): Prisma__DraftProposalClient<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one DraftProposal.
     * @param {DraftProposalUpdateArgs} args - Arguments to update one DraftProposal.
     * @example
     * // Update one DraftProposal
     * const draftProposal = await prisma.draftProposal.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DraftProposalUpdateArgs>(args: SelectSubset<T, DraftProposalUpdateArgs<ExtArgs>>): Prisma__DraftProposalClient<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more DraftProposals.
     * @param {DraftProposalDeleteManyArgs} args - Arguments to filter DraftProposals to delete.
     * @example
     * // Delete a few DraftProposals
     * const { count } = await prisma.draftProposal.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DraftProposalDeleteManyArgs>(args?: SelectSubset<T, DraftProposalDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DraftProposals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DraftProposalUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DraftProposals
     * const draftProposal = await prisma.draftProposal.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DraftProposalUpdateManyArgs>(args: SelectSubset<T, DraftProposalUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DraftProposals and returns the data updated in the database.
     * @param {DraftProposalUpdateManyAndReturnArgs} args - Arguments to update many DraftProposals.
     * @example
     * // Update many DraftProposals
     * const draftProposal = await prisma.draftProposal.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more DraftProposals and only return the `id`
     * const draftProposalWithIdOnly = await prisma.draftProposal.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DraftProposalUpdateManyAndReturnArgs>(args: SelectSubset<T, DraftProposalUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one DraftProposal.
     * @param {DraftProposalUpsertArgs} args - Arguments to update or create a DraftProposal.
     * @example
     * // Update or create a DraftProposal
     * const draftProposal = await prisma.draftProposal.upsert({
     *   create: {
     *     // ... data to create a DraftProposal
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DraftProposal we want to update
     *   }
     * })
     */
    upsert<T extends DraftProposalUpsertArgs>(args: SelectSubset<T, DraftProposalUpsertArgs<ExtArgs>>): Prisma__DraftProposalClient<$Result.GetResult<Prisma.$DraftProposalPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of DraftProposals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DraftProposalCountArgs} args - Arguments to filter DraftProposals to count.
     * @example
     * // Count the number of DraftProposals
     * const count = await prisma.draftProposal.count({
     *   where: {
     *     // ... the filter for the DraftProposals we want to count
     *   }
     * })
    **/
    count<T extends DraftProposalCountArgs>(
      args?: Subset<T, DraftProposalCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DraftProposalCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DraftProposal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DraftProposalAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DraftProposalAggregateArgs>(args: Subset<T, DraftProposalAggregateArgs>): Prisma.PrismaPromise<GetDraftProposalAggregateType<T>>

    /**
     * Group by DraftProposal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DraftProposalGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DraftProposalGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DraftProposalGroupByArgs['orderBy'] }
        : { orderBy?: DraftProposalGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DraftProposalGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDraftProposalGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DraftProposal model
   */
  readonly fields: DraftProposalFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DraftProposal.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DraftProposalClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DraftProposal model
   */
  interface DraftProposalFieldRefs {
    readonly id: FieldRef<"DraftProposal", 'String'>
    readonly source: FieldRef<"DraftProposal", 'String'>
    readonly customerName: FieldRef<"DraftProposal", 'String'>
    readonly customerEmail: FieldRef<"DraftProposal", 'String'>
    readonly service: FieldRef<"DraftProposal", 'String'>
    readonly draftJson: FieldRef<"DraftProposal", 'Json'>
    readonly leadScore: FieldRef<"DraftProposal", 'Int'>
    readonly inquiryId: FieldRef<"DraftProposal", 'String'>
    readonly receivedEmailId: FieldRef<"DraftProposal", 'String'>
    readonly status: FieldRef<"DraftProposal", 'String'>
    readonly createdAt: FieldRef<"DraftProposal", 'DateTime'>
    readonly updatedAt: FieldRef<"DraftProposal", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * DraftProposal findUnique
   */
  export type DraftProposalFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * Filter, which DraftProposal to fetch.
     */
    where: DraftProposalWhereUniqueInput
  }

  /**
   * DraftProposal findUniqueOrThrow
   */
  export type DraftProposalFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * Filter, which DraftProposal to fetch.
     */
    where: DraftProposalWhereUniqueInput
  }

  /**
   * DraftProposal findFirst
   */
  export type DraftProposalFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * Filter, which DraftProposal to fetch.
     */
    where?: DraftProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DraftProposals to fetch.
     */
    orderBy?: DraftProposalOrderByWithRelationInput | DraftProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DraftProposals.
     */
    cursor?: DraftProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DraftProposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DraftProposals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DraftProposals.
     */
    distinct?: DraftProposalScalarFieldEnum | DraftProposalScalarFieldEnum[]
  }

  /**
   * DraftProposal findFirstOrThrow
   */
  export type DraftProposalFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * Filter, which DraftProposal to fetch.
     */
    where?: DraftProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DraftProposals to fetch.
     */
    orderBy?: DraftProposalOrderByWithRelationInput | DraftProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DraftProposals.
     */
    cursor?: DraftProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DraftProposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DraftProposals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DraftProposals.
     */
    distinct?: DraftProposalScalarFieldEnum | DraftProposalScalarFieldEnum[]
  }

  /**
   * DraftProposal findMany
   */
  export type DraftProposalFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * Filter, which DraftProposals to fetch.
     */
    where?: DraftProposalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DraftProposals to fetch.
     */
    orderBy?: DraftProposalOrderByWithRelationInput | DraftProposalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DraftProposals.
     */
    cursor?: DraftProposalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DraftProposals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DraftProposals.
     */
    skip?: number
    distinct?: DraftProposalScalarFieldEnum | DraftProposalScalarFieldEnum[]
  }

  /**
   * DraftProposal create
   */
  export type DraftProposalCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * The data needed to create a DraftProposal.
     */
    data: XOR<DraftProposalCreateInput, DraftProposalUncheckedCreateInput>
  }

  /**
   * DraftProposal createMany
   */
  export type DraftProposalCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DraftProposals.
     */
    data: DraftProposalCreateManyInput | DraftProposalCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DraftProposal createManyAndReturn
   */
  export type DraftProposalCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * The data used to create many DraftProposals.
     */
    data: DraftProposalCreateManyInput | DraftProposalCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DraftProposal update
   */
  export type DraftProposalUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * The data needed to update a DraftProposal.
     */
    data: XOR<DraftProposalUpdateInput, DraftProposalUncheckedUpdateInput>
    /**
     * Choose, which DraftProposal to update.
     */
    where: DraftProposalWhereUniqueInput
  }

  /**
   * DraftProposal updateMany
   */
  export type DraftProposalUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DraftProposals.
     */
    data: XOR<DraftProposalUpdateManyMutationInput, DraftProposalUncheckedUpdateManyInput>
    /**
     * Filter which DraftProposals to update
     */
    where?: DraftProposalWhereInput
    /**
     * Limit how many DraftProposals to update.
     */
    limit?: number
  }

  /**
   * DraftProposal updateManyAndReturn
   */
  export type DraftProposalUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * The data used to update DraftProposals.
     */
    data: XOR<DraftProposalUpdateManyMutationInput, DraftProposalUncheckedUpdateManyInput>
    /**
     * Filter which DraftProposals to update
     */
    where?: DraftProposalWhereInput
    /**
     * Limit how many DraftProposals to update.
     */
    limit?: number
  }

  /**
   * DraftProposal upsert
   */
  export type DraftProposalUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * The filter to search for the DraftProposal to update in case it exists.
     */
    where: DraftProposalWhereUniqueInput
    /**
     * In case the DraftProposal found by the `where` argument doesn't exist, create a new DraftProposal with this data.
     */
    create: XOR<DraftProposalCreateInput, DraftProposalUncheckedCreateInput>
    /**
     * In case the DraftProposal was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DraftProposalUpdateInput, DraftProposalUncheckedUpdateInput>
  }

  /**
   * DraftProposal delete
   */
  export type DraftProposalDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
    /**
     * Filter which DraftProposal to delete.
     */
    where: DraftProposalWhereUniqueInput
  }

  /**
   * DraftProposal deleteMany
   */
  export type DraftProposalDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DraftProposals to delete
     */
    where?: DraftProposalWhereInput
    /**
     * Limit how many DraftProposals to delete.
     */
    limit?: number
  }

  /**
   * DraftProposal without action
   */
  export type DraftProposalDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DraftProposal
     */
    select?: DraftProposalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DraftProposal
     */
    omit?: DraftProposalOmit<ExtArgs> | null
  }


  /**
   * Model WebhookLog
   */

  export type AggregateWebhookLog = {
    _count: WebhookLogCountAggregateOutputType | null
    _avg: WebhookLogAvgAggregateOutputType | null
    _sum: WebhookLogSumAggregateOutputType | null
    _min: WebhookLogMinAggregateOutputType | null
    _max: WebhookLogMaxAggregateOutputType | null
  }

  export type WebhookLogAvgAggregateOutputType = {
    amountKobo: number | null
  }

  export type WebhookLogSumAggregateOutputType = {
    amountKobo: number | null
  }

  export type WebhookLogMinAggregateOutputType = {
    id: string | null
    provider: string | null
    event: string | null
    paystackId: string | null
    reference: string | null
    invoiceId: string | null
    invoiceNumber: string | null
    amountKobo: number | null
    currency: string | null
    signatureValid: boolean | null
    source: string | null
    status: string | null
    error: string | null
    receivedAt: Date | null
    processedAt: Date | null
  }

  export type WebhookLogMaxAggregateOutputType = {
    id: string | null
    provider: string | null
    event: string | null
    paystackId: string | null
    reference: string | null
    invoiceId: string | null
    invoiceNumber: string | null
    amountKobo: number | null
    currency: string | null
    signatureValid: boolean | null
    source: string | null
    status: string | null
    error: string | null
    receivedAt: Date | null
    processedAt: Date | null
  }

  export type WebhookLogCountAggregateOutputType = {
    id: number
    provider: number
    event: number
    paystackId: number
    reference: number
    invoiceId: number
    invoiceNumber: number
    amountKobo: number
    currency: number
    signatureValid: number
    source: number
    status: number
    result: number
    payload: number
    error: number
    receivedAt: number
    processedAt: number
    _all: number
  }


  export type WebhookLogAvgAggregateInputType = {
    amountKobo?: true
  }

  export type WebhookLogSumAggregateInputType = {
    amountKobo?: true
  }

  export type WebhookLogMinAggregateInputType = {
    id?: true
    provider?: true
    event?: true
    paystackId?: true
    reference?: true
    invoiceId?: true
    invoiceNumber?: true
    amountKobo?: true
    currency?: true
    signatureValid?: true
    source?: true
    status?: true
    error?: true
    receivedAt?: true
    processedAt?: true
  }

  export type WebhookLogMaxAggregateInputType = {
    id?: true
    provider?: true
    event?: true
    paystackId?: true
    reference?: true
    invoiceId?: true
    invoiceNumber?: true
    amountKobo?: true
    currency?: true
    signatureValid?: true
    source?: true
    status?: true
    error?: true
    receivedAt?: true
    processedAt?: true
  }

  export type WebhookLogCountAggregateInputType = {
    id?: true
    provider?: true
    event?: true
    paystackId?: true
    reference?: true
    invoiceId?: true
    invoiceNumber?: true
    amountKobo?: true
    currency?: true
    signatureValid?: true
    source?: true
    status?: true
    result?: true
    payload?: true
    error?: true
    receivedAt?: true
    processedAt?: true
    _all?: true
  }

  export type WebhookLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebhookLog to aggregate.
     */
    where?: WebhookLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookLogs to fetch.
     */
    orderBy?: WebhookLogOrderByWithRelationInput | WebhookLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WebhookLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WebhookLogs
    **/
    _count?: true | WebhookLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WebhookLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WebhookLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WebhookLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WebhookLogMaxAggregateInputType
  }

  export type GetWebhookLogAggregateType<T extends WebhookLogAggregateArgs> = {
        [P in keyof T & keyof AggregateWebhookLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWebhookLog[P]>
      : GetScalarType<T[P], AggregateWebhookLog[P]>
  }




  export type WebhookLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WebhookLogWhereInput
    orderBy?: WebhookLogOrderByWithAggregationInput | WebhookLogOrderByWithAggregationInput[]
    by: WebhookLogScalarFieldEnum[] | WebhookLogScalarFieldEnum
    having?: WebhookLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WebhookLogCountAggregateInputType | true
    _avg?: WebhookLogAvgAggregateInputType
    _sum?: WebhookLogSumAggregateInputType
    _min?: WebhookLogMinAggregateInputType
    _max?: WebhookLogMaxAggregateInputType
  }

  export type WebhookLogGroupByOutputType = {
    id: string
    provider: string
    event: string
    paystackId: string | null
    reference: string | null
    invoiceId: string | null
    invoiceNumber: string | null
    amountKobo: number | null
    currency: string | null
    signatureValid: boolean
    source: string
    status: string
    result: JsonValue
    payload: JsonValue
    error: string | null
    receivedAt: Date
    processedAt: Date | null
    _count: WebhookLogCountAggregateOutputType | null
    _avg: WebhookLogAvgAggregateOutputType | null
    _sum: WebhookLogSumAggregateOutputType | null
    _min: WebhookLogMinAggregateOutputType | null
    _max: WebhookLogMaxAggregateOutputType | null
  }

  type GetWebhookLogGroupByPayload<T extends WebhookLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WebhookLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WebhookLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WebhookLogGroupByOutputType[P]>
            : GetScalarType<T[P], WebhookLogGroupByOutputType[P]>
        }
      >
    >


  export type WebhookLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    provider?: boolean
    event?: boolean
    paystackId?: boolean
    reference?: boolean
    invoiceId?: boolean
    invoiceNumber?: boolean
    amountKobo?: boolean
    currency?: boolean
    signatureValid?: boolean
    source?: boolean
    status?: boolean
    result?: boolean
    payload?: boolean
    error?: boolean
    receivedAt?: boolean
    processedAt?: boolean
  }, ExtArgs["result"]["webhookLog"]>

  export type WebhookLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    provider?: boolean
    event?: boolean
    paystackId?: boolean
    reference?: boolean
    invoiceId?: boolean
    invoiceNumber?: boolean
    amountKobo?: boolean
    currency?: boolean
    signatureValid?: boolean
    source?: boolean
    status?: boolean
    result?: boolean
    payload?: boolean
    error?: boolean
    receivedAt?: boolean
    processedAt?: boolean
  }, ExtArgs["result"]["webhookLog"]>

  export type WebhookLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    provider?: boolean
    event?: boolean
    paystackId?: boolean
    reference?: boolean
    invoiceId?: boolean
    invoiceNumber?: boolean
    amountKobo?: boolean
    currency?: boolean
    signatureValid?: boolean
    source?: boolean
    status?: boolean
    result?: boolean
    payload?: boolean
    error?: boolean
    receivedAt?: boolean
    processedAt?: boolean
  }, ExtArgs["result"]["webhookLog"]>

  export type WebhookLogSelectScalar = {
    id?: boolean
    provider?: boolean
    event?: boolean
    paystackId?: boolean
    reference?: boolean
    invoiceId?: boolean
    invoiceNumber?: boolean
    amountKobo?: boolean
    currency?: boolean
    signatureValid?: boolean
    source?: boolean
    status?: boolean
    result?: boolean
    payload?: boolean
    error?: boolean
    receivedAt?: boolean
    processedAt?: boolean
  }

  export type WebhookLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "provider" | "event" | "paystackId" | "reference" | "invoiceId" | "invoiceNumber" | "amountKobo" | "currency" | "signatureValid" | "source" | "status" | "result" | "payload" | "error" | "receivedAt" | "processedAt", ExtArgs["result"]["webhookLog"]>

  export type $WebhookLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WebhookLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      provider: string
      event: string
      paystackId: string | null
      reference: string | null
      invoiceId: string | null
      invoiceNumber: string | null
      amountKobo: number | null
      currency: string | null
      signatureValid: boolean
      source: string
      status: string
      result: Prisma.JsonValue
      payload: Prisma.JsonValue
      error: string | null
      receivedAt: Date
      processedAt: Date | null
    }, ExtArgs["result"]["webhookLog"]>
    composites: {}
  }

  type WebhookLogGetPayload<S extends boolean | null | undefined | WebhookLogDefaultArgs> = $Result.GetResult<Prisma.$WebhookLogPayload, S>

  type WebhookLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WebhookLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WebhookLogCountAggregateInputType | true
    }

  export interface WebhookLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WebhookLog'], meta: { name: 'WebhookLog' } }
    /**
     * Find zero or one WebhookLog that matches the filter.
     * @param {WebhookLogFindUniqueArgs} args - Arguments to find a WebhookLog
     * @example
     * // Get one WebhookLog
     * const webhookLog = await prisma.webhookLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WebhookLogFindUniqueArgs>(args: SelectSubset<T, WebhookLogFindUniqueArgs<ExtArgs>>): Prisma__WebhookLogClient<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WebhookLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WebhookLogFindUniqueOrThrowArgs} args - Arguments to find a WebhookLog
     * @example
     * // Get one WebhookLog
     * const webhookLog = await prisma.webhookLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WebhookLogFindUniqueOrThrowArgs>(args: SelectSubset<T, WebhookLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WebhookLogClient<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WebhookLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookLogFindFirstArgs} args - Arguments to find a WebhookLog
     * @example
     * // Get one WebhookLog
     * const webhookLog = await prisma.webhookLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WebhookLogFindFirstArgs>(args?: SelectSubset<T, WebhookLogFindFirstArgs<ExtArgs>>): Prisma__WebhookLogClient<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WebhookLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookLogFindFirstOrThrowArgs} args - Arguments to find a WebhookLog
     * @example
     * // Get one WebhookLog
     * const webhookLog = await prisma.webhookLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WebhookLogFindFirstOrThrowArgs>(args?: SelectSubset<T, WebhookLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__WebhookLogClient<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WebhookLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WebhookLogs
     * const webhookLogs = await prisma.webhookLog.findMany()
     * 
     * // Get first 10 WebhookLogs
     * const webhookLogs = await prisma.webhookLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const webhookLogWithIdOnly = await prisma.webhookLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WebhookLogFindManyArgs>(args?: SelectSubset<T, WebhookLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WebhookLog.
     * @param {WebhookLogCreateArgs} args - Arguments to create a WebhookLog.
     * @example
     * // Create one WebhookLog
     * const WebhookLog = await prisma.webhookLog.create({
     *   data: {
     *     // ... data to create a WebhookLog
     *   }
     * })
     * 
     */
    create<T extends WebhookLogCreateArgs>(args: SelectSubset<T, WebhookLogCreateArgs<ExtArgs>>): Prisma__WebhookLogClient<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WebhookLogs.
     * @param {WebhookLogCreateManyArgs} args - Arguments to create many WebhookLogs.
     * @example
     * // Create many WebhookLogs
     * const webhookLog = await prisma.webhookLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WebhookLogCreateManyArgs>(args?: SelectSubset<T, WebhookLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WebhookLogs and returns the data saved in the database.
     * @param {WebhookLogCreateManyAndReturnArgs} args - Arguments to create many WebhookLogs.
     * @example
     * // Create many WebhookLogs
     * const webhookLog = await prisma.webhookLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WebhookLogs and only return the `id`
     * const webhookLogWithIdOnly = await prisma.webhookLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WebhookLogCreateManyAndReturnArgs>(args?: SelectSubset<T, WebhookLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WebhookLog.
     * @param {WebhookLogDeleteArgs} args - Arguments to delete one WebhookLog.
     * @example
     * // Delete one WebhookLog
     * const WebhookLog = await prisma.webhookLog.delete({
     *   where: {
     *     // ... filter to delete one WebhookLog
     *   }
     * })
     * 
     */
    delete<T extends WebhookLogDeleteArgs>(args: SelectSubset<T, WebhookLogDeleteArgs<ExtArgs>>): Prisma__WebhookLogClient<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WebhookLog.
     * @param {WebhookLogUpdateArgs} args - Arguments to update one WebhookLog.
     * @example
     * // Update one WebhookLog
     * const webhookLog = await prisma.webhookLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WebhookLogUpdateArgs>(args: SelectSubset<T, WebhookLogUpdateArgs<ExtArgs>>): Prisma__WebhookLogClient<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WebhookLogs.
     * @param {WebhookLogDeleteManyArgs} args - Arguments to filter WebhookLogs to delete.
     * @example
     * // Delete a few WebhookLogs
     * const { count } = await prisma.webhookLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WebhookLogDeleteManyArgs>(args?: SelectSubset<T, WebhookLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WebhookLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WebhookLogs
     * const webhookLog = await prisma.webhookLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WebhookLogUpdateManyArgs>(args: SelectSubset<T, WebhookLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WebhookLogs and returns the data updated in the database.
     * @param {WebhookLogUpdateManyAndReturnArgs} args - Arguments to update many WebhookLogs.
     * @example
     * // Update many WebhookLogs
     * const webhookLog = await prisma.webhookLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WebhookLogs and only return the `id`
     * const webhookLogWithIdOnly = await prisma.webhookLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WebhookLogUpdateManyAndReturnArgs>(args: SelectSubset<T, WebhookLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WebhookLog.
     * @param {WebhookLogUpsertArgs} args - Arguments to update or create a WebhookLog.
     * @example
     * // Update or create a WebhookLog
     * const webhookLog = await prisma.webhookLog.upsert({
     *   create: {
     *     // ... data to create a WebhookLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WebhookLog we want to update
     *   }
     * })
     */
    upsert<T extends WebhookLogUpsertArgs>(args: SelectSubset<T, WebhookLogUpsertArgs<ExtArgs>>): Prisma__WebhookLogClient<$Result.GetResult<Prisma.$WebhookLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WebhookLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookLogCountArgs} args - Arguments to filter WebhookLogs to count.
     * @example
     * // Count the number of WebhookLogs
     * const count = await prisma.webhookLog.count({
     *   where: {
     *     // ... the filter for the WebhookLogs we want to count
     *   }
     * })
    **/
    count<T extends WebhookLogCountArgs>(
      args?: Subset<T, WebhookLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WebhookLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WebhookLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WebhookLogAggregateArgs>(args: Subset<T, WebhookLogAggregateArgs>): Prisma.PrismaPromise<GetWebhookLogAggregateType<T>>

    /**
     * Group by WebhookLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WebhookLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WebhookLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WebhookLogGroupByArgs['orderBy'] }
        : { orderBy?: WebhookLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WebhookLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWebhookLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WebhookLog model
   */
  readonly fields: WebhookLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WebhookLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WebhookLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WebhookLog model
   */
  interface WebhookLogFieldRefs {
    readonly id: FieldRef<"WebhookLog", 'String'>
    readonly provider: FieldRef<"WebhookLog", 'String'>
    readonly event: FieldRef<"WebhookLog", 'String'>
    readonly paystackId: FieldRef<"WebhookLog", 'String'>
    readonly reference: FieldRef<"WebhookLog", 'String'>
    readonly invoiceId: FieldRef<"WebhookLog", 'String'>
    readonly invoiceNumber: FieldRef<"WebhookLog", 'String'>
    readonly amountKobo: FieldRef<"WebhookLog", 'Int'>
    readonly currency: FieldRef<"WebhookLog", 'String'>
    readonly signatureValid: FieldRef<"WebhookLog", 'Boolean'>
    readonly source: FieldRef<"WebhookLog", 'String'>
    readonly status: FieldRef<"WebhookLog", 'String'>
    readonly result: FieldRef<"WebhookLog", 'Json'>
    readonly payload: FieldRef<"WebhookLog", 'Json'>
    readonly error: FieldRef<"WebhookLog", 'String'>
    readonly receivedAt: FieldRef<"WebhookLog", 'DateTime'>
    readonly processedAt: FieldRef<"WebhookLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WebhookLog findUnique
   */
  export type WebhookLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * Filter, which WebhookLog to fetch.
     */
    where: WebhookLogWhereUniqueInput
  }

  /**
   * WebhookLog findUniqueOrThrow
   */
  export type WebhookLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * Filter, which WebhookLog to fetch.
     */
    where: WebhookLogWhereUniqueInput
  }

  /**
   * WebhookLog findFirst
   */
  export type WebhookLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * Filter, which WebhookLog to fetch.
     */
    where?: WebhookLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookLogs to fetch.
     */
    orderBy?: WebhookLogOrderByWithRelationInput | WebhookLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebhookLogs.
     */
    cursor?: WebhookLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebhookLogs.
     */
    distinct?: WebhookLogScalarFieldEnum | WebhookLogScalarFieldEnum[]
  }

  /**
   * WebhookLog findFirstOrThrow
   */
  export type WebhookLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * Filter, which WebhookLog to fetch.
     */
    where?: WebhookLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookLogs to fetch.
     */
    orderBy?: WebhookLogOrderByWithRelationInput | WebhookLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WebhookLogs.
     */
    cursor?: WebhookLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WebhookLogs.
     */
    distinct?: WebhookLogScalarFieldEnum | WebhookLogScalarFieldEnum[]
  }

  /**
   * WebhookLog findMany
   */
  export type WebhookLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * Filter, which WebhookLogs to fetch.
     */
    where?: WebhookLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WebhookLogs to fetch.
     */
    orderBy?: WebhookLogOrderByWithRelationInput | WebhookLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WebhookLogs.
     */
    cursor?: WebhookLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WebhookLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WebhookLogs.
     */
    skip?: number
    distinct?: WebhookLogScalarFieldEnum | WebhookLogScalarFieldEnum[]
  }

  /**
   * WebhookLog create
   */
  export type WebhookLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * The data needed to create a WebhookLog.
     */
    data: XOR<WebhookLogCreateInput, WebhookLogUncheckedCreateInput>
  }

  /**
   * WebhookLog createMany
   */
  export type WebhookLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WebhookLogs.
     */
    data: WebhookLogCreateManyInput | WebhookLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WebhookLog createManyAndReturn
   */
  export type WebhookLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * The data used to create many WebhookLogs.
     */
    data: WebhookLogCreateManyInput | WebhookLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WebhookLog update
   */
  export type WebhookLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * The data needed to update a WebhookLog.
     */
    data: XOR<WebhookLogUpdateInput, WebhookLogUncheckedUpdateInput>
    /**
     * Choose, which WebhookLog to update.
     */
    where: WebhookLogWhereUniqueInput
  }

  /**
   * WebhookLog updateMany
   */
  export type WebhookLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WebhookLogs.
     */
    data: XOR<WebhookLogUpdateManyMutationInput, WebhookLogUncheckedUpdateManyInput>
    /**
     * Filter which WebhookLogs to update
     */
    where?: WebhookLogWhereInput
    /**
     * Limit how many WebhookLogs to update.
     */
    limit?: number
  }

  /**
   * WebhookLog updateManyAndReturn
   */
  export type WebhookLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * The data used to update WebhookLogs.
     */
    data: XOR<WebhookLogUpdateManyMutationInput, WebhookLogUncheckedUpdateManyInput>
    /**
     * Filter which WebhookLogs to update
     */
    where?: WebhookLogWhereInput
    /**
     * Limit how many WebhookLogs to update.
     */
    limit?: number
  }

  /**
   * WebhookLog upsert
   */
  export type WebhookLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * The filter to search for the WebhookLog to update in case it exists.
     */
    where: WebhookLogWhereUniqueInput
    /**
     * In case the WebhookLog found by the `where` argument doesn't exist, create a new WebhookLog with this data.
     */
    create: XOR<WebhookLogCreateInput, WebhookLogUncheckedCreateInput>
    /**
     * In case the WebhookLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WebhookLogUpdateInput, WebhookLogUncheckedUpdateInput>
  }

  /**
   * WebhookLog delete
   */
  export type WebhookLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
    /**
     * Filter which WebhookLog to delete.
     */
    where: WebhookLogWhereUniqueInput
  }

  /**
   * WebhookLog deleteMany
   */
  export type WebhookLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WebhookLogs to delete
     */
    where?: WebhookLogWhereInput
    /**
     * Limit how many WebhookLogs to delete.
     */
    limit?: number
  }

  /**
   * WebhookLog without action
   */
  export type WebhookLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WebhookLog
     */
    select?: WebhookLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WebhookLog
     */
    omit?: WebhookLogOmit<ExtArgs> | null
  }


  /**
   * Model AdminSession
   */

  export type AggregateAdminSession = {
    _count: AdminSessionCountAggregateOutputType | null
    _min: AdminSessionMinAggregateOutputType | null
    _max: AdminSessionMaxAggregateOutputType | null
  }

  export type AdminSessionMinAggregateOutputType = {
    id: string | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type AdminSessionMaxAggregateOutputType = {
    id: string | null
    token: string | null
    expiresAt: Date | null
    createdAt: Date | null
  }

  export type AdminSessionCountAggregateOutputType = {
    id: number
    token: number
    expiresAt: number
    createdAt: number
    _all: number
  }


  export type AdminSessionMinAggregateInputType = {
    id?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type AdminSessionMaxAggregateInputType = {
    id?: true
    token?: true
    expiresAt?: true
    createdAt?: true
  }

  export type AdminSessionCountAggregateInputType = {
    id?: true
    token?: true
    expiresAt?: true
    createdAt?: true
    _all?: true
  }

  export type AdminSessionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AdminSession to aggregate.
     */
    where?: AdminSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminSessions to fetch.
     */
    orderBy?: AdminSessionOrderByWithRelationInput | AdminSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AdminSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AdminSessions
    **/
    _count?: true | AdminSessionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AdminSessionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AdminSessionMaxAggregateInputType
  }

  export type GetAdminSessionAggregateType<T extends AdminSessionAggregateArgs> = {
        [P in keyof T & keyof AggregateAdminSession]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAdminSession[P]>
      : GetScalarType<T[P], AggregateAdminSession[P]>
  }




  export type AdminSessionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AdminSessionWhereInput
    orderBy?: AdminSessionOrderByWithAggregationInput | AdminSessionOrderByWithAggregationInput[]
    by: AdminSessionScalarFieldEnum[] | AdminSessionScalarFieldEnum
    having?: AdminSessionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AdminSessionCountAggregateInputType | true
    _min?: AdminSessionMinAggregateInputType
    _max?: AdminSessionMaxAggregateInputType
  }

  export type AdminSessionGroupByOutputType = {
    id: string
    token: string
    expiresAt: Date
    createdAt: Date
    _count: AdminSessionCountAggregateOutputType | null
    _min: AdminSessionMinAggregateOutputType | null
    _max: AdminSessionMaxAggregateOutputType | null
  }

  type GetAdminSessionGroupByPayload<T extends AdminSessionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AdminSessionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AdminSessionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AdminSessionGroupByOutputType[P]>
            : GetScalarType<T[P], AdminSessionGroupByOutputType[P]>
        }
      >
    >


  export type AdminSessionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["adminSession"]>

  export type AdminSessionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["adminSession"]>

  export type AdminSessionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["adminSession"]>

  export type AdminSessionSelectScalar = {
    id?: boolean
    token?: boolean
    expiresAt?: boolean
    createdAt?: boolean
  }

  export type AdminSessionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "token" | "expiresAt" | "createdAt", ExtArgs["result"]["adminSession"]>

  export type $AdminSessionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AdminSession"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      token: string
      expiresAt: Date
      createdAt: Date
    }, ExtArgs["result"]["adminSession"]>
    composites: {}
  }

  type AdminSessionGetPayload<S extends boolean | null | undefined | AdminSessionDefaultArgs> = $Result.GetResult<Prisma.$AdminSessionPayload, S>

  type AdminSessionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AdminSessionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AdminSessionCountAggregateInputType | true
    }

  export interface AdminSessionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AdminSession'], meta: { name: 'AdminSession' } }
    /**
     * Find zero or one AdminSession that matches the filter.
     * @param {AdminSessionFindUniqueArgs} args - Arguments to find a AdminSession
     * @example
     * // Get one AdminSession
     * const adminSession = await prisma.adminSession.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AdminSessionFindUniqueArgs>(args: SelectSubset<T, AdminSessionFindUniqueArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AdminSession that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AdminSessionFindUniqueOrThrowArgs} args - Arguments to find a AdminSession
     * @example
     * // Get one AdminSession
     * const adminSession = await prisma.adminSession.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AdminSessionFindUniqueOrThrowArgs>(args: SelectSubset<T, AdminSessionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AdminSession that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionFindFirstArgs} args - Arguments to find a AdminSession
     * @example
     * // Get one AdminSession
     * const adminSession = await prisma.adminSession.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AdminSessionFindFirstArgs>(args?: SelectSubset<T, AdminSessionFindFirstArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AdminSession that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionFindFirstOrThrowArgs} args - Arguments to find a AdminSession
     * @example
     * // Get one AdminSession
     * const adminSession = await prisma.adminSession.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AdminSessionFindFirstOrThrowArgs>(args?: SelectSubset<T, AdminSessionFindFirstOrThrowArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AdminSessions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AdminSessions
     * const adminSessions = await prisma.adminSession.findMany()
     * 
     * // Get first 10 AdminSessions
     * const adminSessions = await prisma.adminSession.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const adminSessionWithIdOnly = await prisma.adminSession.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AdminSessionFindManyArgs>(args?: SelectSubset<T, AdminSessionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AdminSession.
     * @param {AdminSessionCreateArgs} args - Arguments to create a AdminSession.
     * @example
     * // Create one AdminSession
     * const AdminSession = await prisma.adminSession.create({
     *   data: {
     *     // ... data to create a AdminSession
     *   }
     * })
     * 
     */
    create<T extends AdminSessionCreateArgs>(args: SelectSubset<T, AdminSessionCreateArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AdminSessions.
     * @param {AdminSessionCreateManyArgs} args - Arguments to create many AdminSessions.
     * @example
     * // Create many AdminSessions
     * const adminSession = await prisma.adminSession.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AdminSessionCreateManyArgs>(args?: SelectSubset<T, AdminSessionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AdminSessions and returns the data saved in the database.
     * @param {AdminSessionCreateManyAndReturnArgs} args - Arguments to create many AdminSessions.
     * @example
     * // Create many AdminSessions
     * const adminSession = await prisma.adminSession.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AdminSessions and only return the `id`
     * const adminSessionWithIdOnly = await prisma.adminSession.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AdminSessionCreateManyAndReturnArgs>(args?: SelectSubset<T, AdminSessionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AdminSession.
     * @param {AdminSessionDeleteArgs} args - Arguments to delete one AdminSession.
     * @example
     * // Delete one AdminSession
     * const AdminSession = await prisma.adminSession.delete({
     *   where: {
     *     // ... filter to delete one AdminSession
     *   }
     * })
     * 
     */
    delete<T extends AdminSessionDeleteArgs>(args: SelectSubset<T, AdminSessionDeleteArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AdminSession.
     * @param {AdminSessionUpdateArgs} args - Arguments to update one AdminSession.
     * @example
     * // Update one AdminSession
     * const adminSession = await prisma.adminSession.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AdminSessionUpdateArgs>(args: SelectSubset<T, AdminSessionUpdateArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AdminSessions.
     * @param {AdminSessionDeleteManyArgs} args - Arguments to filter AdminSessions to delete.
     * @example
     * // Delete a few AdminSessions
     * const { count } = await prisma.adminSession.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AdminSessionDeleteManyArgs>(args?: SelectSubset<T, AdminSessionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AdminSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AdminSessions
     * const adminSession = await prisma.adminSession.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AdminSessionUpdateManyArgs>(args: SelectSubset<T, AdminSessionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AdminSessions and returns the data updated in the database.
     * @param {AdminSessionUpdateManyAndReturnArgs} args - Arguments to update many AdminSessions.
     * @example
     * // Update many AdminSessions
     * const adminSession = await prisma.adminSession.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AdminSessions and only return the `id`
     * const adminSessionWithIdOnly = await prisma.adminSession.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AdminSessionUpdateManyAndReturnArgs>(args: SelectSubset<T, AdminSessionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AdminSession.
     * @param {AdminSessionUpsertArgs} args - Arguments to update or create a AdminSession.
     * @example
     * // Update or create a AdminSession
     * const adminSession = await prisma.adminSession.upsert({
     *   create: {
     *     // ... data to create a AdminSession
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AdminSession we want to update
     *   }
     * })
     */
    upsert<T extends AdminSessionUpsertArgs>(args: SelectSubset<T, AdminSessionUpsertArgs<ExtArgs>>): Prisma__AdminSessionClient<$Result.GetResult<Prisma.$AdminSessionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AdminSessions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionCountArgs} args - Arguments to filter AdminSessions to count.
     * @example
     * // Count the number of AdminSessions
     * const count = await prisma.adminSession.count({
     *   where: {
     *     // ... the filter for the AdminSessions we want to count
     *   }
     * })
    **/
    count<T extends AdminSessionCountArgs>(
      args?: Subset<T, AdminSessionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AdminSessionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AdminSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AdminSessionAggregateArgs>(args: Subset<T, AdminSessionAggregateArgs>): Prisma.PrismaPromise<GetAdminSessionAggregateType<T>>

    /**
     * Group by AdminSession.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AdminSessionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AdminSessionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AdminSessionGroupByArgs['orderBy'] }
        : { orderBy?: AdminSessionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AdminSessionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAdminSessionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AdminSession model
   */
  readonly fields: AdminSessionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AdminSession.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AdminSessionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AdminSession model
   */
  interface AdminSessionFieldRefs {
    readonly id: FieldRef<"AdminSession", 'String'>
    readonly token: FieldRef<"AdminSession", 'String'>
    readonly expiresAt: FieldRef<"AdminSession", 'DateTime'>
    readonly createdAt: FieldRef<"AdminSession", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AdminSession findUnique
   */
  export type AdminSessionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Filter, which AdminSession to fetch.
     */
    where: AdminSessionWhereUniqueInput
  }

  /**
   * AdminSession findUniqueOrThrow
   */
  export type AdminSessionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Filter, which AdminSession to fetch.
     */
    where: AdminSessionWhereUniqueInput
  }

  /**
   * AdminSession findFirst
   */
  export type AdminSessionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Filter, which AdminSession to fetch.
     */
    where?: AdminSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminSessions to fetch.
     */
    orderBy?: AdminSessionOrderByWithRelationInput | AdminSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AdminSessions.
     */
    cursor?: AdminSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AdminSessions.
     */
    distinct?: AdminSessionScalarFieldEnum | AdminSessionScalarFieldEnum[]
  }

  /**
   * AdminSession findFirstOrThrow
   */
  export type AdminSessionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Filter, which AdminSession to fetch.
     */
    where?: AdminSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminSessions to fetch.
     */
    orderBy?: AdminSessionOrderByWithRelationInput | AdminSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AdminSessions.
     */
    cursor?: AdminSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminSessions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AdminSessions.
     */
    distinct?: AdminSessionScalarFieldEnum | AdminSessionScalarFieldEnum[]
  }

  /**
   * AdminSession findMany
   */
  export type AdminSessionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Filter, which AdminSessions to fetch.
     */
    where?: AdminSessionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AdminSessions to fetch.
     */
    orderBy?: AdminSessionOrderByWithRelationInput | AdminSessionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AdminSessions.
     */
    cursor?: AdminSessionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AdminSessions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AdminSessions.
     */
    skip?: number
    distinct?: AdminSessionScalarFieldEnum | AdminSessionScalarFieldEnum[]
  }

  /**
   * AdminSession create
   */
  export type AdminSessionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * The data needed to create a AdminSession.
     */
    data: XOR<AdminSessionCreateInput, AdminSessionUncheckedCreateInput>
  }

  /**
   * AdminSession createMany
   */
  export type AdminSessionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AdminSessions.
     */
    data: AdminSessionCreateManyInput | AdminSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AdminSession createManyAndReturn
   */
  export type AdminSessionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * The data used to create many AdminSessions.
     */
    data: AdminSessionCreateManyInput | AdminSessionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AdminSession update
   */
  export type AdminSessionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * The data needed to update a AdminSession.
     */
    data: XOR<AdminSessionUpdateInput, AdminSessionUncheckedUpdateInput>
    /**
     * Choose, which AdminSession to update.
     */
    where: AdminSessionWhereUniqueInput
  }

  /**
   * AdminSession updateMany
   */
  export type AdminSessionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AdminSessions.
     */
    data: XOR<AdminSessionUpdateManyMutationInput, AdminSessionUncheckedUpdateManyInput>
    /**
     * Filter which AdminSessions to update
     */
    where?: AdminSessionWhereInput
    /**
     * Limit how many AdminSessions to update.
     */
    limit?: number
  }

  /**
   * AdminSession updateManyAndReturn
   */
  export type AdminSessionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * The data used to update AdminSessions.
     */
    data: XOR<AdminSessionUpdateManyMutationInput, AdminSessionUncheckedUpdateManyInput>
    /**
     * Filter which AdminSessions to update
     */
    where?: AdminSessionWhereInput
    /**
     * Limit how many AdminSessions to update.
     */
    limit?: number
  }

  /**
   * AdminSession upsert
   */
  export type AdminSessionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * The filter to search for the AdminSession to update in case it exists.
     */
    where: AdminSessionWhereUniqueInput
    /**
     * In case the AdminSession found by the `where` argument doesn't exist, create a new AdminSession with this data.
     */
    create: XOR<AdminSessionCreateInput, AdminSessionUncheckedCreateInput>
    /**
     * In case the AdminSession was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AdminSessionUpdateInput, AdminSessionUncheckedUpdateInput>
  }

  /**
   * AdminSession delete
   */
  export type AdminSessionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
    /**
     * Filter which AdminSession to delete.
     */
    where: AdminSessionWhereUniqueInput
  }

  /**
   * AdminSession deleteMany
   */
  export type AdminSessionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AdminSessions to delete
     */
    where?: AdminSessionWhereInput
    /**
     * Limit how many AdminSessions to delete.
     */
    limit?: number
  }

  /**
   * AdminSession without action
   */
  export type AdminSessionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AdminSession
     */
    select?: AdminSessionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AdminSession
     */
    omit?: AdminSessionOmit<ExtArgs> | null
  }


  /**
   * Model Subscriber
   */

  export type AggregateSubscriber = {
    _count: SubscriberCountAggregateOutputType | null
    _min: SubscriberMinAggregateOutputType | null
    _max: SubscriberMaxAggregateOutputType | null
  }

  export type SubscriberMinAggregateOutputType = {
    id: string | null
    email: string | null
    status: string | null
    confirmToken: string | null
    unsubscribeToken: string | null
    confirmedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubscriberMaxAggregateOutputType = {
    id: string | null
    email: string | null
    status: string | null
    confirmToken: string | null
    unsubscribeToken: string | null
    confirmedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type SubscriberCountAggregateOutputType = {
    id: number
    email: number
    status: number
    confirmToken: number
    unsubscribeToken: number
    confirmedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type SubscriberMinAggregateInputType = {
    id?: true
    email?: true
    status?: true
    confirmToken?: true
    unsubscribeToken?: true
    confirmedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubscriberMaxAggregateInputType = {
    id?: true
    email?: true
    status?: true
    confirmToken?: true
    unsubscribeToken?: true
    confirmedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type SubscriberCountAggregateInputType = {
    id?: true
    email?: true
    status?: true
    confirmToken?: true
    unsubscribeToken?: true
    confirmedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type SubscriberAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subscriber to aggregate.
     */
    where?: SubscriberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscribers to fetch.
     */
    orderBy?: SubscriberOrderByWithRelationInput | SubscriberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SubscriberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscribers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscribers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Subscribers
    **/
    _count?: true | SubscriberCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SubscriberMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SubscriberMaxAggregateInputType
  }

  export type GetSubscriberAggregateType<T extends SubscriberAggregateArgs> = {
        [P in keyof T & keyof AggregateSubscriber]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSubscriber[P]>
      : GetScalarType<T[P], AggregateSubscriber[P]>
  }




  export type SubscriberGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SubscriberWhereInput
    orderBy?: SubscriberOrderByWithAggregationInput | SubscriberOrderByWithAggregationInput[]
    by: SubscriberScalarFieldEnum[] | SubscriberScalarFieldEnum
    having?: SubscriberScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SubscriberCountAggregateInputType | true
    _min?: SubscriberMinAggregateInputType
    _max?: SubscriberMaxAggregateInputType
  }

  export type SubscriberGroupByOutputType = {
    id: string
    email: string
    status: string
    confirmToken: string | null
    unsubscribeToken: string | null
    confirmedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: SubscriberCountAggregateOutputType | null
    _min: SubscriberMinAggregateOutputType | null
    _max: SubscriberMaxAggregateOutputType | null
  }

  type GetSubscriberGroupByPayload<T extends SubscriberGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SubscriberGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SubscriberGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SubscriberGroupByOutputType[P]>
            : GetScalarType<T[P], SubscriberGroupByOutputType[P]>
        }
      >
    >


  export type SubscriberSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    status?: boolean
    confirmToken?: boolean
    unsubscribeToken?: boolean
    confirmedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["subscriber"]>

  export type SubscriberSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    status?: boolean
    confirmToken?: boolean
    unsubscribeToken?: boolean
    confirmedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["subscriber"]>

  export type SubscriberSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    status?: boolean
    confirmToken?: boolean
    unsubscribeToken?: boolean
    confirmedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["subscriber"]>

  export type SubscriberSelectScalar = {
    id?: boolean
    email?: boolean
    status?: boolean
    confirmToken?: boolean
    unsubscribeToken?: boolean
    confirmedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type SubscriberOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "email" | "status" | "confirmToken" | "unsubscribeToken" | "confirmedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["subscriber"]>

  export type $SubscriberPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Subscriber"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      status: string
      confirmToken: string | null
      unsubscribeToken: string | null
      confirmedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["subscriber"]>
    composites: {}
  }

  type SubscriberGetPayload<S extends boolean | null | undefined | SubscriberDefaultArgs> = $Result.GetResult<Prisma.$SubscriberPayload, S>

  type SubscriberCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SubscriberFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SubscriberCountAggregateInputType | true
    }

  export interface SubscriberDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Subscriber'], meta: { name: 'Subscriber' } }
    /**
     * Find zero or one Subscriber that matches the filter.
     * @param {SubscriberFindUniqueArgs} args - Arguments to find a Subscriber
     * @example
     * // Get one Subscriber
     * const subscriber = await prisma.subscriber.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SubscriberFindUniqueArgs>(args: SelectSubset<T, SubscriberFindUniqueArgs<ExtArgs>>): Prisma__SubscriberClient<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Subscriber that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SubscriberFindUniqueOrThrowArgs} args - Arguments to find a Subscriber
     * @example
     * // Get one Subscriber
     * const subscriber = await prisma.subscriber.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SubscriberFindUniqueOrThrowArgs>(args: SelectSubset<T, SubscriberFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SubscriberClient<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subscriber that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriberFindFirstArgs} args - Arguments to find a Subscriber
     * @example
     * // Get one Subscriber
     * const subscriber = await prisma.subscriber.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SubscriberFindFirstArgs>(args?: SelectSubset<T, SubscriberFindFirstArgs<ExtArgs>>): Prisma__SubscriberClient<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Subscriber that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriberFindFirstOrThrowArgs} args - Arguments to find a Subscriber
     * @example
     * // Get one Subscriber
     * const subscriber = await prisma.subscriber.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SubscriberFindFirstOrThrowArgs>(args?: SelectSubset<T, SubscriberFindFirstOrThrowArgs<ExtArgs>>): Prisma__SubscriberClient<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Subscribers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriberFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Subscribers
     * const subscribers = await prisma.subscriber.findMany()
     * 
     * // Get first 10 Subscribers
     * const subscribers = await prisma.subscriber.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const subscriberWithIdOnly = await prisma.subscriber.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SubscriberFindManyArgs>(args?: SelectSubset<T, SubscriberFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Subscriber.
     * @param {SubscriberCreateArgs} args - Arguments to create a Subscriber.
     * @example
     * // Create one Subscriber
     * const Subscriber = await prisma.subscriber.create({
     *   data: {
     *     // ... data to create a Subscriber
     *   }
     * })
     * 
     */
    create<T extends SubscriberCreateArgs>(args: SelectSubset<T, SubscriberCreateArgs<ExtArgs>>): Prisma__SubscriberClient<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Subscribers.
     * @param {SubscriberCreateManyArgs} args - Arguments to create many Subscribers.
     * @example
     * // Create many Subscribers
     * const subscriber = await prisma.subscriber.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SubscriberCreateManyArgs>(args?: SelectSubset<T, SubscriberCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Subscribers and returns the data saved in the database.
     * @param {SubscriberCreateManyAndReturnArgs} args - Arguments to create many Subscribers.
     * @example
     * // Create many Subscribers
     * const subscriber = await prisma.subscriber.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Subscribers and only return the `id`
     * const subscriberWithIdOnly = await prisma.subscriber.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SubscriberCreateManyAndReturnArgs>(args?: SelectSubset<T, SubscriberCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Subscriber.
     * @param {SubscriberDeleteArgs} args - Arguments to delete one Subscriber.
     * @example
     * // Delete one Subscriber
     * const Subscriber = await prisma.subscriber.delete({
     *   where: {
     *     // ... filter to delete one Subscriber
     *   }
     * })
     * 
     */
    delete<T extends SubscriberDeleteArgs>(args: SelectSubset<T, SubscriberDeleteArgs<ExtArgs>>): Prisma__SubscriberClient<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Subscriber.
     * @param {SubscriberUpdateArgs} args - Arguments to update one Subscriber.
     * @example
     * // Update one Subscriber
     * const subscriber = await prisma.subscriber.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SubscriberUpdateArgs>(args: SelectSubset<T, SubscriberUpdateArgs<ExtArgs>>): Prisma__SubscriberClient<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Subscribers.
     * @param {SubscriberDeleteManyArgs} args - Arguments to filter Subscribers to delete.
     * @example
     * // Delete a few Subscribers
     * const { count } = await prisma.subscriber.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SubscriberDeleteManyArgs>(args?: SelectSubset<T, SubscriberDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subscribers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriberUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Subscribers
     * const subscriber = await prisma.subscriber.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SubscriberUpdateManyArgs>(args: SelectSubset<T, SubscriberUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Subscribers and returns the data updated in the database.
     * @param {SubscriberUpdateManyAndReturnArgs} args - Arguments to update many Subscribers.
     * @example
     * // Update many Subscribers
     * const subscriber = await prisma.subscriber.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Subscribers and only return the `id`
     * const subscriberWithIdOnly = await prisma.subscriber.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SubscriberUpdateManyAndReturnArgs>(args: SelectSubset<T, SubscriberUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Subscriber.
     * @param {SubscriberUpsertArgs} args - Arguments to update or create a Subscriber.
     * @example
     * // Update or create a Subscriber
     * const subscriber = await prisma.subscriber.upsert({
     *   create: {
     *     // ... data to create a Subscriber
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Subscriber we want to update
     *   }
     * })
     */
    upsert<T extends SubscriberUpsertArgs>(args: SelectSubset<T, SubscriberUpsertArgs<ExtArgs>>): Prisma__SubscriberClient<$Result.GetResult<Prisma.$SubscriberPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Subscribers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriberCountArgs} args - Arguments to filter Subscribers to count.
     * @example
     * // Count the number of Subscribers
     * const count = await prisma.subscriber.count({
     *   where: {
     *     // ... the filter for the Subscribers we want to count
     *   }
     * })
    **/
    count<T extends SubscriberCountArgs>(
      args?: Subset<T, SubscriberCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SubscriberCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Subscriber.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriberAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SubscriberAggregateArgs>(args: Subset<T, SubscriberAggregateArgs>): Prisma.PrismaPromise<GetSubscriberAggregateType<T>>

    /**
     * Group by Subscriber.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SubscriberGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SubscriberGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SubscriberGroupByArgs['orderBy'] }
        : { orderBy?: SubscriberGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SubscriberGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSubscriberGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Subscriber model
   */
  readonly fields: SubscriberFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Subscriber.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SubscriberClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Subscriber model
   */
  interface SubscriberFieldRefs {
    readonly id: FieldRef<"Subscriber", 'String'>
    readonly email: FieldRef<"Subscriber", 'String'>
    readonly status: FieldRef<"Subscriber", 'String'>
    readonly confirmToken: FieldRef<"Subscriber", 'String'>
    readonly unsubscribeToken: FieldRef<"Subscriber", 'String'>
    readonly confirmedAt: FieldRef<"Subscriber", 'DateTime'>
    readonly createdAt: FieldRef<"Subscriber", 'DateTime'>
    readonly updatedAt: FieldRef<"Subscriber", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Subscriber findUnique
   */
  export type SubscriberFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * Filter, which Subscriber to fetch.
     */
    where: SubscriberWhereUniqueInput
  }

  /**
   * Subscriber findUniqueOrThrow
   */
  export type SubscriberFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * Filter, which Subscriber to fetch.
     */
    where: SubscriberWhereUniqueInput
  }

  /**
   * Subscriber findFirst
   */
  export type SubscriberFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * Filter, which Subscriber to fetch.
     */
    where?: SubscriberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscribers to fetch.
     */
    orderBy?: SubscriberOrderByWithRelationInput | SubscriberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subscribers.
     */
    cursor?: SubscriberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscribers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscribers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subscribers.
     */
    distinct?: SubscriberScalarFieldEnum | SubscriberScalarFieldEnum[]
  }

  /**
   * Subscriber findFirstOrThrow
   */
  export type SubscriberFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * Filter, which Subscriber to fetch.
     */
    where?: SubscriberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscribers to fetch.
     */
    orderBy?: SubscriberOrderByWithRelationInput | SubscriberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Subscribers.
     */
    cursor?: SubscriberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscribers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscribers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Subscribers.
     */
    distinct?: SubscriberScalarFieldEnum | SubscriberScalarFieldEnum[]
  }

  /**
   * Subscriber findMany
   */
  export type SubscriberFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * Filter, which Subscribers to fetch.
     */
    where?: SubscriberWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Subscribers to fetch.
     */
    orderBy?: SubscriberOrderByWithRelationInput | SubscriberOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Subscribers.
     */
    cursor?: SubscriberWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Subscribers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Subscribers.
     */
    skip?: number
    distinct?: SubscriberScalarFieldEnum | SubscriberScalarFieldEnum[]
  }

  /**
   * Subscriber create
   */
  export type SubscriberCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * The data needed to create a Subscriber.
     */
    data: XOR<SubscriberCreateInput, SubscriberUncheckedCreateInput>
  }

  /**
   * Subscriber createMany
   */
  export type SubscriberCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Subscribers.
     */
    data: SubscriberCreateManyInput | SubscriberCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Subscriber createManyAndReturn
   */
  export type SubscriberCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * The data used to create many Subscribers.
     */
    data: SubscriberCreateManyInput | SubscriberCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Subscriber update
   */
  export type SubscriberUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * The data needed to update a Subscriber.
     */
    data: XOR<SubscriberUpdateInput, SubscriberUncheckedUpdateInput>
    /**
     * Choose, which Subscriber to update.
     */
    where: SubscriberWhereUniqueInput
  }

  /**
   * Subscriber updateMany
   */
  export type SubscriberUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Subscribers.
     */
    data: XOR<SubscriberUpdateManyMutationInput, SubscriberUncheckedUpdateManyInput>
    /**
     * Filter which Subscribers to update
     */
    where?: SubscriberWhereInput
    /**
     * Limit how many Subscribers to update.
     */
    limit?: number
  }

  /**
   * Subscriber updateManyAndReturn
   */
  export type SubscriberUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * The data used to update Subscribers.
     */
    data: XOR<SubscriberUpdateManyMutationInput, SubscriberUncheckedUpdateManyInput>
    /**
     * Filter which Subscribers to update
     */
    where?: SubscriberWhereInput
    /**
     * Limit how many Subscribers to update.
     */
    limit?: number
  }

  /**
   * Subscriber upsert
   */
  export type SubscriberUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * The filter to search for the Subscriber to update in case it exists.
     */
    where: SubscriberWhereUniqueInput
    /**
     * In case the Subscriber found by the `where` argument doesn't exist, create a new Subscriber with this data.
     */
    create: XOR<SubscriberCreateInput, SubscriberUncheckedCreateInput>
    /**
     * In case the Subscriber was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SubscriberUpdateInput, SubscriberUncheckedUpdateInput>
  }

  /**
   * Subscriber delete
   */
  export type SubscriberDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
    /**
     * Filter which Subscriber to delete.
     */
    where: SubscriberWhereUniqueInput
  }

  /**
   * Subscriber deleteMany
   */
  export type SubscriberDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Subscribers to delete
     */
    where?: SubscriberWhereInput
    /**
     * Limit how many Subscribers to delete.
     */
    limit?: number
  }

  /**
   * Subscriber without action
   */
  export type SubscriberDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Subscriber
     */
    select?: SubscriberSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Subscriber
     */
    omit?: SubscriberOmit<ExtArgs> | null
  }


  /**
   * Model Post
   */

  export type AggregatePost = {
    _count: PostCountAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  export type PostMinAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    excerpt: string | null
    content: string | null
    category: string | null
    author: string | null
    status: string | null
    publishedAt: Date | null
    notifySentAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PostMaxAggregateOutputType = {
    id: string | null
    title: string | null
    slug: string | null
    excerpt: string | null
    content: string | null
    category: string | null
    author: string | null
    status: string | null
    publishedAt: Date | null
    notifySentAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PostCountAggregateOutputType = {
    id: number
    title: number
    slug: number
    excerpt: number
    content: number
    category: number
    tags: number
    author: number
    status: number
    publishedAt: number
    notifySentAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PostMinAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    excerpt?: true
    content?: true
    category?: true
    author?: true
    status?: true
    publishedAt?: true
    notifySentAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PostMaxAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    excerpt?: true
    content?: true
    category?: true
    author?: true
    status?: true
    publishedAt?: true
    notifySentAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PostCountAggregateInputType = {
    id?: true
    title?: true
    slug?: true
    excerpt?: true
    content?: true
    category?: true
    tags?: true
    author?: true
    status?: true
    publishedAt?: true
    notifySentAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PostAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Post to aggregate.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Posts
    **/
    _count?: true | PostCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PostMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PostMaxAggregateInputType
  }

  export type GetPostAggregateType<T extends PostAggregateArgs> = {
        [P in keyof T & keyof AggregatePost]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePost[P]>
      : GetScalarType<T[P], AggregatePost[P]>
  }




  export type PostGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PostWhereInput
    orderBy?: PostOrderByWithAggregationInput | PostOrderByWithAggregationInput[]
    by: PostScalarFieldEnum[] | PostScalarFieldEnum
    having?: PostScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PostCountAggregateInputType | true
    _min?: PostMinAggregateInputType
    _max?: PostMaxAggregateInputType
  }

  export type PostGroupByOutputType = {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    category: string
    tags: JsonValue
    author: string
    status: string
    publishedAt: Date | null
    notifySentAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: PostCountAggregateOutputType | null
    _min: PostMinAggregateOutputType | null
    _max: PostMaxAggregateOutputType | null
  }

  type GetPostGroupByPayload<T extends PostGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PostGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PostGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PostGroupByOutputType[P]>
            : GetScalarType<T[P], PostGroupByOutputType[P]>
        }
      >
    >


  export type PostSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    excerpt?: boolean
    content?: boolean
    category?: boolean
    tags?: boolean
    author?: boolean
    status?: boolean
    publishedAt?: boolean
    notifySentAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["post"]>

  export type PostSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    excerpt?: boolean
    content?: boolean
    category?: boolean
    tags?: boolean
    author?: boolean
    status?: boolean
    publishedAt?: boolean
    notifySentAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["post"]>

  export type PostSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    title?: boolean
    slug?: boolean
    excerpt?: boolean
    content?: boolean
    category?: boolean
    tags?: boolean
    author?: boolean
    status?: boolean
    publishedAt?: boolean
    notifySentAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["post"]>

  export type PostSelectScalar = {
    id?: boolean
    title?: boolean
    slug?: boolean
    excerpt?: boolean
    content?: boolean
    category?: boolean
    tags?: boolean
    author?: boolean
    status?: boolean
    publishedAt?: boolean
    notifySentAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PostOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "title" | "slug" | "excerpt" | "content" | "category" | "tags" | "author" | "status" | "publishedAt" | "notifySentAt" | "createdAt" | "updatedAt", ExtArgs["result"]["post"]>

  export type $PostPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Post"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      title: string
      slug: string
      excerpt: string
      content: string
      category: string
      tags: Prisma.JsonValue
      author: string
      status: string
      publishedAt: Date | null
      notifySentAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["post"]>
    composites: {}
  }

  type PostGetPayload<S extends boolean | null | undefined | PostDefaultArgs> = $Result.GetResult<Prisma.$PostPayload, S>

  type PostCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PostFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: PostCountAggregateInputType | true
    }

  export interface PostDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Post'], meta: { name: 'Post' } }
    /**
     * Find zero or one Post that matches the filter.
     * @param {PostFindUniqueArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PostFindUniqueArgs>(args: SelectSubset<T, PostFindUniqueArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Post that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PostFindUniqueOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PostFindUniqueOrThrowArgs>(args: SelectSubset<T, PostFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PostFindFirstArgs>(args?: SelectSubset<T, PostFindFirstArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Post that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindFirstOrThrowArgs} args - Arguments to find a Post
     * @example
     * // Get one Post
     * const post = await prisma.post.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PostFindFirstOrThrowArgs>(args?: SelectSubset<T, PostFindFirstOrThrowArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Posts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Posts
     * const posts = await prisma.post.findMany()
     * 
     * // Get first 10 Posts
     * const posts = await prisma.post.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const postWithIdOnly = await prisma.post.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PostFindManyArgs>(args?: SelectSubset<T, PostFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Post.
     * @param {PostCreateArgs} args - Arguments to create a Post.
     * @example
     * // Create one Post
     * const Post = await prisma.post.create({
     *   data: {
     *     // ... data to create a Post
     *   }
     * })
     * 
     */
    create<T extends PostCreateArgs>(args: SelectSubset<T, PostCreateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Posts.
     * @param {PostCreateManyArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PostCreateManyArgs>(args?: SelectSubset<T, PostCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Posts and returns the data saved in the database.
     * @param {PostCreateManyAndReturnArgs} args - Arguments to create many Posts.
     * @example
     * // Create many Posts
     * const post = await prisma.post.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Posts and only return the `id`
     * const postWithIdOnly = await prisma.post.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PostCreateManyAndReturnArgs>(args?: SelectSubset<T, PostCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Post.
     * @param {PostDeleteArgs} args - Arguments to delete one Post.
     * @example
     * // Delete one Post
     * const Post = await prisma.post.delete({
     *   where: {
     *     // ... filter to delete one Post
     *   }
     * })
     * 
     */
    delete<T extends PostDeleteArgs>(args: SelectSubset<T, PostDeleteArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Post.
     * @param {PostUpdateArgs} args - Arguments to update one Post.
     * @example
     * // Update one Post
     * const post = await prisma.post.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PostUpdateArgs>(args: SelectSubset<T, PostUpdateArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Posts.
     * @param {PostDeleteManyArgs} args - Arguments to filter Posts to delete.
     * @example
     * // Delete a few Posts
     * const { count } = await prisma.post.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PostDeleteManyArgs>(args?: SelectSubset<T, PostDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PostUpdateManyArgs>(args: SelectSubset<T, PostUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Posts and returns the data updated in the database.
     * @param {PostUpdateManyAndReturnArgs} args - Arguments to update many Posts.
     * @example
     * // Update many Posts
     * const post = await prisma.post.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Posts and only return the `id`
     * const postWithIdOnly = await prisma.post.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PostUpdateManyAndReturnArgs>(args: SelectSubset<T, PostUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Post.
     * @param {PostUpsertArgs} args - Arguments to update or create a Post.
     * @example
     * // Update or create a Post
     * const post = await prisma.post.upsert({
     *   create: {
     *     // ... data to create a Post
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Post we want to update
     *   }
     * })
     */
    upsert<T extends PostUpsertArgs>(args: SelectSubset<T, PostUpsertArgs<ExtArgs>>): Prisma__PostClient<$Result.GetResult<Prisma.$PostPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Posts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostCountArgs} args - Arguments to filter Posts to count.
     * @example
     * // Count the number of Posts
     * const count = await prisma.post.count({
     *   where: {
     *     // ... the filter for the Posts we want to count
     *   }
     * })
    **/
    count<T extends PostCountArgs>(
      args?: Subset<T, PostCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PostCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PostAggregateArgs>(args: Subset<T, PostAggregateArgs>): Prisma.PrismaPromise<GetPostAggregateType<T>>

    /**
     * Group by Post.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PostGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PostGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PostGroupByArgs['orderBy'] }
        : { orderBy?: PostGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Post model
   */
  readonly fields: PostFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Post.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PostClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Post model
   */
  interface PostFieldRefs {
    readonly id: FieldRef<"Post", 'String'>
    readonly title: FieldRef<"Post", 'String'>
    readonly slug: FieldRef<"Post", 'String'>
    readonly excerpt: FieldRef<"Post", 'String'>
    readonly content: FieldRef<"Post", 'String'>
    readonly category: FieldRef<"Post", 'String'>
    readonly tags: FieldRef<"Post", 'Json'>
    readonly author: FieldRef<"Post", 'String'>
    readonly status: FieldRef<"Post", 'String'>
    readonly publishedAt: FieldRef<"Post", 'DateTime'>
    readonly notifySentAt: FieldRef<"Post", 'DateTime'>
    readonly createdAt: FieldRef<"Post", 'DateTime'>
    readonly updatedAt: FieldRef<"Post", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Post findUnique
   */
  export type PostFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findUniqueOrThrow
   */
  export type PostFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post findFirst
   */
  export type PostFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findFirstOrThrow
   */
  export type PostFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter, which Post to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Posts.
     */
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post findMany
   */
  export type PostFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter, which Posts to fetch.
     */
    where?: PostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Posts to fetch.
     */
    orderBy?: PostOrderByWithRelationInput | PostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Posts.
     */
    cursor?: PostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Posts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Posts.
     */
    skip?: number
    distinct?: PostScalarFieldEnum | PostScalarFieldEnum[]
  }

  /**
   * Post create
   */
  export type PostCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data needed to create a Post.
     */
    data: XOR<PostCreateInput, PostUncheckedCreateInput>
  }

  /**
   * Post createMany
   */
  export type PostCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Post createManyAndReturn
   */
  export type PostCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data used to create many Posts.
     */
    data: PostCreateManyInput | PostCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Post update
   */
  export type PostUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data needed to update a Post.
     */
    data: XOR<PostUpdateInput, PostUncheckedUpdateInput>
    /**
     * Choose, which Post to update.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post updateMany
   */
  export type PostUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
  }

  /**
   * Post updateManyAndReturn
   */
  export type PostUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The data used to update Posts.
     */
    data: XOR<PostUpdateManyMutationInput, PostUncheckedUpdateManyInput>
    /**
     * Filter which Posts to update
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to update.
     */
    limit?: number
  }

  /**
   * Post upsert
   */
  export type PostUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * The filter to search for the Post to update in case it exists.
     */
    where: PostWhereUniqueInput
    /**
     * In case the Post found by the `where` argument doesn't exist, create a new Post with this data.
     */
    create: XOR<PostCreateInput, PostUncheckedCreateInput>
    /**
     * In case the Post was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PostUpdateInput, PostUncheckedUpdateInput>
  }

  /**
   * Post delete
   */
  export type PostDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
    /**
     * Filter which Post to delete.
     */
    where: PostWhereUniqueInput
  }

  /**
   * Post deleteMany
   */
  export type PostDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Posts to delete
     */
    where?: PostWhereInput
    /**
     * Limit how many Posts to delete.
     */
    limit?: number
  }

  /**
   * Post without action
   */
  export type PostDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Post
     */
    select?: PostSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Post
     */
    omit?: PostOmit<ExtArgs> | null
  }


  /**
   * Model Testimonial
   */

  export type AggregateTestimonial = {
    _count: TestimonialCountAggregateOutputType | null
    _avg: TestimonialAvgAggregateOutputType | null
    _sum: TestimonialSumAggregateOutputType | null
    _min: TestimonialMinAggregateOutputType | null
    _max: TestimonialMaxAggregateOutputType | null
  }

  export type TestimonialAvgAggregateOutputType = {
    rating: number | null
    sortOrder: number | null
  }

  export type TestimonialSumAggregateOutputType = {
    rating: number | null
    sortOrder: number | null
  }

  export type TestimonialMinAggregateOutputType = {
    id: string | null
    name: string | null
    role: string | null
    service: string | null
    text: string | null
    rating: number | null
    avatar: string | null
    status: string | null
    sortOrder: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TestimonialMaxAggregateOutputType = {
    id: string | null
    name: string | null
    role: string | null
    service: string | null
    text: string | null
    rating: number | null
    avatar: string | null
    status: string | null
    sortOrder: number | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type TestimonialCountAggregateOutputType = {
    id: number
    name: number
    role: number
    service: number
    text: number
    rating: number
    avatar: number
    status: number
    sortOrder: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type TestimonialAvgAggregateInputType = {
    rating?: true
    sortOrder?: true
  }

  export type TestimonialSumAggregateInputType = {
    rating?: true
    sortOrder?: true
  }

  export type TestimonialMinAggregateInputType = {
    id?: true
    name?: true
    role?: true
    service?: true
    text?: true
    rating?: true
    avatar?: true
    status?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TestimonialMaxAggregateInputType = {
    id?: true
    name?: true
    role?: true
    service?: true
    text?: true
    rating?: true
    avatar?: true
    status?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
  }

  export type TestimonialCountAggregateInputType = {
    id?: true
    name?: true
    role?: true
    service?: true
    text?: true
    rating?: true
    avatar?: true
    status?: true
    sortOrder?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type TestimonialAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Testimonial to aggregate.
     */
    where?: TestimonialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Testimonials to fetch.
     */
    orderBy?: TestimonialOrderByWithRelationInput | TestimonialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TestimonialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Testimonials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Testimonials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Testimonials
    **/
    _count?: true | TestimonialCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TestimonialAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TestimonialSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TestimonialMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TestimonialMaxAggregateInputType
  }

  export type GetTestimonialAggregateType<T extends TestimonialAggregateArgs> = {
        [P in keyof T & keyof AggregateTestimonial]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTestimonial[P]>
      : GetScalarType<T[P], AggregateTestimonial[P]>
  }




  export type TestimonialGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TestimonialWhereInput
    orderBy?: TestimonialOrderByWithAggregationInput | TestimonialOrderByWithAggregationInput[]
    by: TestimonialScalarFieldEnum[] | TestimonialScalarFieldEnum
    having?: TestimonialScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TestimonialCountAggregateInputType | true
    _avg?: TestimonialAvgAggregateInputType
    _sum?: TestimonialSumAggregateInputType
    _min?: TestimonialMinAggregateInputType
    _max?: TestimonialMaxAggregateInputType
  }

  export type TestimonialGroupByOutputType = {
    id: string
    name: string
    role: string
    service: string
    text: string
    rating: number
    avatar: string | null
    status: string
    sortOrder: number
    createdAt: Date
    updatedAt: Date
    _count: TestimonialCountAggregateOutputType | null
    _avg: TestimonialAvgAggregateOutputType | null
    _sum: TestimonialSumAggregateOutputType | null
    _min: TestimonialMinAggregateOutputType | null
    _max: TestimonialMaxAggregateOutputType | null
  }

  type GetTestimonialGroupByPayload<T extends TestimonialGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TestimonialGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TestimonialGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TestimonialGroupByOutputType[P]>
            : GetScalarType<T[P], TestimonialGroupByOutputType[P]>
        }
      >
    >


  export type TestimonialSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    role?: boolean
    service?: boolean
    text?: boolean
    rating?: boolean
    avatar?: boolean
    status?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["testimonial"]>

  export type TestimonialSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    role?: boolean
    service?: boolean
    text?: boolean
    rating?: boolean
    avatar?: boolean
    status?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["testimonial"]>

  export type TestimonialSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    role?: boolean
    service?: boolean
    text?: boolean
    rating?: boolean
    avatar?: boolean
    status?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["testimonial"]>

  export type TestimonialSelectScalar = {
    id?: boolean
    name?: boolean
    role?: boolean
    service?: boolean
    text?: boolean
    rating?: boolean
    avatar?: boolean
    status?: boolean
    sortOrder?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type TestimonialOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "role" | "service" | "text" | "rating" | "avatar" | "status" | "sortOrder" | "createdAt" | "updatedAt", ExtArgs["result"]["testimonial"]>

  export type $TestimonialPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Testimonial"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      role: string
      service: string
      text: string
      rating: number
      avatar: string | null
      status: string
      sortOrder: number
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["testimonial"]>
    composites: {}
  }

  type TestimonialGetPayload<S extends boolean | null | undefined | TestimonialDefaultArgs> = $Result.GetResult<Prisma.$TestimonialPayload, S>

  type TestimonialCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TestimonialFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: TestimonialCountAggregateInputType | true
    }

  export interface TestimonialDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Testimonial'], meta: { name: 'Testimonial' } }
    /**
     * Find zero or one Testimonial that matches the filter.
     * @param {TestimonialFindUniqueArgs} args - Arguments to find a Testimonial
     * @example
     * // Get one Testimonial
     * const testimonial = await prisma.testimonial.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TestimonialFindUniqueArgs>(args: SelectSubset<T, TestimonialFindUniqueArgs<ExtArgs>>): Prisma__TestimonialClient<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Testimonial that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TestimonialFindUniqueOrThrowArgs} args - Arguments to find a Testimonial
     * @example
     * // Get one Testimonial
     * const testimonial = await prisma.testimonial.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TestimonialFindUniqueOrThrowArgs>(args: SelectSubset<T, TestimonialFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TestimonialClient<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Testimonial that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestimonialFindFirstArgs} args - Arguments to find a Testimonial
     * @example
     * // Get one Testimonial
     * const testimonial = await prisma.testimonial.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TestimonialFindFirstArgs>(args?: SelectSubset<T, TestimonialFindFirstArgs<ExtArgs>>): Prisma__TestimonialClient<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Testimonial that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestimonialFindFirstOrThrowArgs} args - Arguments to find a Testimonial
     * @example
     * // Get one Testimonial
     * const testimonial = await prisma.testimonial.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TestimonialFindFirstOrThrowArgs>(args?: SelectSubset<T, TestimonialFindFirstOrThrowArgs<ExtArgs>>): Prisma__TestimonialClient<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Testimonials that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestimonialFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Testimonials
     * const testimonials = await prisma.testimonial.findMany()
     * 
     * // Get first 10 Testimonials
     * const testimonials = await prisma.testimonial.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const testimonialWithIdOnly = await prisma.testimonial.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TestimonialFindManyArgs>(args?: SelectSubset<T, TestimonialFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Testimonial.
     * @param {TestimonialCreateArgs} args - Arguments to create a Testimonial.
     * @example
     * // Create one Testimonial
     * const Testimonial = await prisma.testimonial.create({
     *   data: {
     *     // ... data to create a Testimonial
     *   }
     * })
     * 
     */
    create<T extends TestimonialCreateArgs>(args: SelectSubset<T, TestimonialCreateArgs<ExtArgs>>): Prisma__TestimonialClient<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Testimonials.
     * @param {TestimonialCreateManyArgs} args - Arguments to create many Testimonials.
     * @example
     * // Create many Testimonials
     * const testimonial = await prisma.testimonial.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TestimonialCreateManyArgs>(args?: SelectSubset<T, TestimonialCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Testimonials and returns the data saved in the database.
     * @param {TestimonialCreateManyAndReturnArgs} args - Arguments to create many Testimonials.
     * @example
     * // Create many Testimonials
     * const testimonial = await prisma.testimonial.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Testimonials and only return the `id`
     * const testimonialWithIdOnly = await prisma.testimonial.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TestimonialCreateManyAndReturnArgs>(args?: SelectSubset<T, TestimonialCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Testimonial.
     * @param {TestimonialDeleteArgs} args - Arguments to delete one Testimonial.
     * @example
     * // Delete one Testimonial
     * const Testimonial = await prisma.testimonial.delete({
     *   where: {
     *     // ... filter to delete one Testimonial
     *   }
     * })
     * 
     */
    delete<T extends TestimonialDeleteArgs>(args: SelectSubset<T, TestimonialDeleteArgs<ExtArgs>>): Prisma__TestimonialClient<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Testimonial.
     * @param {TestimonialUpdateArgs} args - Arguments to update one Testimonial.
     * @example
     * // Update one Testimonial
     * const testimonial = await prisma.testimonial.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TestimonialUpdateArgs>(args: SelectSubset<T, TestimonialUpdateArgs<ExtArgs>>): Prisma__TestimonialClient<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Testimonials.
     * @param {TestimonialDeleteManyArgs} args - Arguments to filter Testimonials to delete.
     * @example
     * // Delete a few Testimonials
     * const { count } = await prisma.testimonial.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TestimonialDeleteManyArgs>(args?: SelectSubset<T, TestimonialDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Testimonials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestimonialUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Testimonials
     * const testimonial = await prisma.testimonial.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TestimonialUpdateManyArgs>(args: SelectSubset<T, TestimonialUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Testimonials and returns the data updated in the database.
     * @param {TestimonialUpdateManyAndReturnArgs} args - Arguments to update many Testimonials.
     * @example
     * // Update many Testimonials
     * const testimonial = await prisma.testimonial.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Testimonials and only return the `id`
     * const testimonialWithIdOnly = await prisma.testimonial.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TestimonialUpdateManyAndReturnArgs>(args: SelectSubset<T, TestimonialUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Testimonial.
     * @param {TestimonialUpsertArgs} args - Arguments to update or create a Testimonial.
     * @example
     * // Update or create a Testimonial
     * const testimonial = await prisma.testimonial.upsert({
     *   create: {
     *     // ... data to create a Testimonial
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Testimonial we want to update
     *   }
     * })
     */
    upsert<T extends TestimonialUpsertArgs>(args: SelectSubset<T, TestimonialUpsertArgs<ExtArgs>>): Prisma__TestimonialClient<$Result.GetResult<Prisma.$TestimonialPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Testimonials.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestimonialCountArgs} args - Arguments to filter Testimonials to count.
     * @example
     * // Count the number of Testimonials
     * const count = await prisma.testimonial.count({
     *   where: {
     *     // ... the filter for the Testimonials we want to count
     *   }
     * })
    **/
    count<T extends TestimonialCountArgs>(
      args?: Subset<T, TestimonialCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TestimonialCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Testimonial.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestimonialAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TestimonialAggregateArgs>(args: Subset<T, TestimonialAggregateArgs>): Prisma.PrismaPromise<GetTestimonialAggregateType<T>>

    /**
     * Group by Testimonial.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TestimonialGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TestimonialGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TestimonialGroupByArgs['orderBy'] }
        : { orderBy?: TestimonialGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TestimonialGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTestimonialGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Testimonial model
   */
  readonly fields: TestimonialFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Testimonial.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TestimonialClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Testimonial model
   */
  interface TestimonialFieldRefs {
    readonly id: FieldRef<"Testimonial", 'String'>
    readonly name: FieldRef<"Testimonial", 'String'>
    readonly role: FieldRef<"Testimonial", 'String'>
    readonly service: FieldRef<"Testimonial", 'String'>
    readonly text: FieldRef<"Testimonial", 'String'>
    readonly rating: FieldRef<"Testimonial", 'Int'>
    readonly avatar: FieldRef<"Testimonial", 'String'>
    readonly status: FieldRef<"Testimonial", 'String'>
    readonly sortOrder: FieldRef<"Testimonial", 'Int'>
    readonly createdAt: FieldRef<"Testimonial", 'DateTime'>
    readonly updatedAt: FieldRef<"Testimonial", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Testimonial findUnique
   */
  export type TestimonialFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * Filter, which Testimonial to fetch.
     */
    where: TestimonialWhereUniqueInput
  }

  /**
   * Testimonial findUniqueOrThrow
   */
  export type TestimonialFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * Filter, which Testimonial to fetch.
     */
    where: TestimonialWhereUniqueInput
  }

  /**
   * Testimonial findFirst
   */
  export type TestimonialFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * Filter, which Testimonial to fetch.
     */
    where?: TestimonialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Testimonials to fetch.
     */
    orderBy?: TestimonialOrderByWithRelationInput | TestimonialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Testimonials.
     */
    cursor?: TestimonialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Testimonials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Testimonials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Testimonials.
     */
    distinct?: TestimonialScalarFieldEnum | TestimonialScalarFieldEnum[]
  }

  /**
   * Testimonial findFirstOrThrow
   */
  export type TestimonialFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * Filter, which Testimonial to fetch.
     */
    where?: TestimonialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Testimonials to fetch.
     */
    orderBy?: TestimonialOrderByWithRelationInput | TestimonialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Testimonials.
     */
    cursor?: TestimonialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Testimonials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Testimonials.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Testimonials.
     */
    distinct?: TestimonialScalarFieldEnum | TestimonialScalarFieldEnum[]
  }

  /**
   * Testimonial findMany
   */
  export type TestimonialFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * Filter, which Testimonials to fetch.
     */
    where?: TestimonialWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Testimonials to fetch.
     */
    orderBy?: TestimonialOrderByWithRelationInput | TestimonialOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Testimonials.
     */
    cursor?: TestimonialWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Testimonials from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Testimonials.
     */
    skip?: number
    distinct?: TestimonialScalarFieldEnum | TestimonialScalarFieldEnum[]
  }

  /**
   * Testimonial create
   */
  export type TestimonialCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * The data needed to create a Testimonial.
     */
    data: XOR<TestimonialCreateInput, TestimonialUncheckedCreateInput>
  }

  /**
   * Testimonial createMany
   */
  export type TestimonialCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Testimonials.
     */
    data: TestimonialCreateManyInput | TestimonialCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Testimonial createManyAndReturn
   */
  export type TestimonialCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * The data used to create many Testimonials.
     */
    data: TestimonialCreateManyInput | TestimonialCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Testimonial update
   */
  export type TestimonialUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * The data needed to update a Testimonial.
     */
    data: XOR<TestimonialUpdateInput, TestimonialUncheckedUpdateInput>
    /**
     * Choose, which Testimonial to update.
     */
    where: TestimonialWhereUniqueInput
  }

  /**
   * Testimonial updateMany
   */
  export type TestimonialUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Testimonials.
     */
    data: XOR<TestimonialUpdateManyMutationInput, TestimonialUncheckedUpdateManyInput>
    /**
     * Filter which Testimonials to update
     */
    where?: TestimonialWhereInput
    /**
     * Limit how many Testimonials to update.
     */
    limit?: number
  }

  /**
   * Testimonial updateManyAndReturn
   */
  export type TestimonialUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * The data used to update Testimonials.
     */
    data: XOR<TestimonialUpdateManyMutationInput, TestimonialUncheckedUpdateManyInput>
    /**
     * Filter which Testimonials to update
     */
    where?: TestimonialWhereInput
    /**
     * Limit how many Testimonials to update.
     */
    limit?: number
  }

  /**
   * Testimonial upsert
   */
  export type TestimonialUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * The filter to search for the Testimonial to update in case it exists.
     */
    where: TestimonialWhereUniqueInput
    /**
     * In case the Testimonial found by the `where` argument doesn't exist, create a new Testimonial with this data.
     */
    create: XOR<TestimonialCreateInput, TestimonialUncheckedCreateInput>
    /**
     * In case the Testimonial was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TestimonialUpdateInput, TestimonialUncheckedUpdateInput>
  }

  /**
   * Testimonial delete
   */
  export type TestimonialDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
    /**
     * Filter which Testimonial to delete.
     */
    where: TestimonialWhereUniqueInput
  }

  /**
   * Testimonial deleteMany
   */
  export type TestimonialDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Testimonials to delete
     */
    where?: TestimonialWhereInput
    /**
     * Limit how many Testimonials to delete.
     */
    limit?: number
  }

  /**
   * Testimonial without action
   */
  export type TestimonialDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Testimonial
     */
    select?: TestimonialSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Testimonial
     */
    omit?: TestimonialOmit<ExtArgs> | null
  }


  /**
   * Model EmailLog
   */

  export type AggregateEmailLog = {
    _count: EmailLogCountAggregateOutputType | null
    _min: EmailLogMinAggregateOutputType | null
    _max: EmailLogMaxAggregateOutputType | null
  }

  export type EmailLogMinAggregateOutputType = {
    id: string | null
    type: string | null
    recipientEmail: string | null
    subject: string | null
    postId: string | null
    subscriberId: string | null
    status: string | null
    error: string | null
    sentAt: Date | null
    bodyText: string | null
    bodyHtml: string | null
    invoiceId: string | null
    provider: string | null
  }

  export type EmailLogMaxAggregateOutputType = {
    id: string | null
    type: string | null
    recipientEmail: string | null
    subject: string | null
    postId: string | null
    subscriberId: string | null
    status: string | null
    error: string | null
    sentAt: Date | null
    bodyText: string | null
    bodyHtml: string | null
    invoiceId: string | null
    provider: string | null
  }

  export type EmailLogCountAggregateOutputType = {
    id: number
    type: number
    recipientEmail: number
    subject: number
    postId: number
    subscriberId: number
    status: number
    error: number
    sentAt: number
    bodyText: number
    bodyHtml: number
    attachments: number
    invoiceId: number
    provider: number
    _all: number
  }


  export type EmailLogMinAggregateInputType = {
    id?: true
    type?: true
    recipientEmail?: true
    subject?: true
    postId?: true
    subscriberId?: true
    status?: true
    error?: true
    sentAt?: true
    bodyText?: true
    bodyHtml?: true
    invoiceId?: true
    provider?: true
  }

  export type EmailLogMaxAggregateInputType = {
    id?: true
    type?: true
    recipientEmail?: true
    subject?: true
    postId?: true
    subscriberId?: true
    status?: true
    error?: true
    sentAt?: true
    bodyText?: true
    bodyHtml?: true
    invoiceId?: true
    provider?: true
  }

  export type EmailLogCountAggregateInputType = {
    id?: true
    type?: true
    recipientEmail?: true
    subject?: true
    postId?: true
    subscriberId?: true
    status?: true
    error?: true
    sentAt?: true
    bodyText?: true
    bodyHtml?: true
    attachments?: true
    invoiceId?: true
    provider?: true
    _all?: true
  }

  export type EmailLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EmailLog to aggregate.
     */
    where?: EmailLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailLogs to fetch.
     */
    orderBy?: EmailLogOrderByWithRelationInput | EmailLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EmailLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EmailLogs
    **/
    _count?: true | EmailLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EmailLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EmailLogMaxAggregateInputType
  }

  export type GetEmailLogAggregateType<T extends EmailLogAggregateArgs> = {
        [P in keyof T & keyof AggregateEmailLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEmailLog[P]>
      : GetScalarType<T[P], AggregateEmailLog[P]>
  }




  export type EmailLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmailLogWhereInput
    orderBy?: EmailLogOrderByWithAggregationInput | EmailLogOrderByWithAggregationInput[]
    by: EmailLogScalarFieldEnum[] | EmailLogScalarFieldEnum
    having?: EmailLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EmailLogCountAggregateInputType | true
    _min?: EmailLogMinAggregateInputType
    _max?: EmailLogMaxAggregateInputType
  }

  export type EmailLogGroupByOutputType = {
    id: string
    type: string
    recipientEmail: string
    subject: string
    postId: string | null
    subscriberId: string | null
    status: string
    error: string | null
    sentAt: Date
    bodyText: string | null
    bodyHtml: string | null
    attachments: JsonValue
    invoiceId: string | null
    provider: string | null
    _count: EmailLogCountAggregateOutputType | null
    _min: EmailLogMinAggregateOutputType | null
    _max: EmailLogMaxAggregateOutputType | null
  }

  type GetEmailLogGroupByPayload<T extends EmailLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EmailLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EmailLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EmailLogGroupByOutputType[P]>
            : GetScalarType<T[P], EmailLogGroupByOutputType[P]>
        }
      >
    >


  export type EmailLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    recipientEmail?: boolean
    subject?: boolean
    postId?: boolean
    subscriberId?: boolean
    status?: boolean
    error?: boolean
    sentAt?: boolean
    bodyText?: boolean
    bodyHtml?: boolean
    attachments?: boolean
    invoiceId?: boolean
    provider?: boolean
  }, ExtArgs["result"]["emailLog"]>

  export type EmailLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    recipientEmail?: boolean
    subject?: boolean
    postId?: boolean
    subscriberId?: boolean
    status?: boolean
    error?: boolean
    sentAt?: boolean
    bodyText?: boolean
    bodyHtml?: boolean
    attachments?: boolean
    invoiceId?: boolean
    provider?: boolean
  }, ExtArgs["result"]["emailLog"]>

  export type EmailLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    recipientEmail?: boolean
    subject?: boolean
    postId?: boolean
    subscriberId?: boolean
    status?: boolean
    error?: boolean
    sentAt?: boolean
    bodyText?: boolean
    bodyHtml?: boolean
    attachments?: boolean
    invoiceId?: boolean
    provider?: boolean
  }, ExtArgs["result"]["emailLog"]>

  export type EmailLogSelectScalar = {
    id?: boolean
    type?: boolean
    recipientEmail?: boolean
    subject?: boolean
    postId?: boolean
    subscriberId?: boolean
    status?: boolean
    error?: boolean
    sentAt?: boolean
    bodyText?: boolean
    bodyHtml?: boolean
    attachments?: boolean
    invoiceId?: boolean
    provider?: boolean
  }

  export type EmailLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "type" | "recipientEmail" | "subject" | "postId" | "subscriberId" | "status" | "error" | "sentAt" | "bodyText" | "bodyHtml" | "attachments" | "invoiceId" | "provider", ExtArgs["result"]["emailLog"]>

  export type $EmailLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EmailLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: string
      recipientEmail: string
      subject: string
      postId: string | null
      subscriberId: string | null
      status: string
      error: string | null
      sentAt: Date
      bodyText: string | null
      bodyHtml: string | null
      attachments: Prisma.JsonValue
      invoiceId: string | null
      provider: string | null
    }, ExtArgs["result"]["emailLog"]>
    composites: {}
  }

  type EmailLogGetPayload<S extends boolean | null | undefined | EmailLogDefaultArgs> = $Result.GetResult<Prisma.$EmailLogPayload, S>

  type EmailLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EmailLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EmailLogCountAggregateInputType | true
    }

  export interface EmailLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EmailLog'], meta: { name: 'EmailLog' } }
    /**
     * Find zero or one EmailLog that matches the filter.
     * @param {EmailLogFindUniqueArgs} args - Arguments to find a EmailLog
     * @example
     * // Get one EmailLog
     * const emailLog = await prisma.emailLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EmailLogFindUniqueArgs>(args: SelectSubset<T, EmailLogFindUniqueArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EmailLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EmailLogFindUniqueOrThrowArgs} args - Arguments to find a EmailLog
     * @example
     * // Get one EmailLog
     * const emailLog = await prisma.emailLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EmailLogFindUniqueOrThrowArgs>(args: SelectSubset<T, EmailLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EmailLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogFindFirstArgs} args - Arguments to find a EmailLog
     * @example
     * // Get one EmailLog
     * const emailLog = await prisma.emailLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EmailLogFindFirstArgs>(args?: SelectSubset<T, EmailLogFindFirstArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EmailLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogFindFirstOrThrowArgs} args - Arguments to find a EmailLog
     * @example
     * // Get one EmailLog
     * const emailLog = await prisma.emailLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EmailLogFindFirstOrThrowArgs>(args?: SelectSubset<T, EmailLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EmailLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EmailLogs
     * const emailLogs = await prisma.emailLog.findMany()
     * 
     * // Get first 10 EmailLogs
     * const emailLogs = await prisma.emailLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const emailLogWithIdOnly = await prisma.emailLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EmailLogFindManyArgs>(args?: SelectSubset<T, EmailLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EmailLog.
     * @param {EmailLogCreateArgs} args - Arguments to create a EmailLog.
     * @example
     * // Create one EmailLog
     * const EmailLog = await prisma.emailLog.create({
     *   data: {
     *     // ... data to create a EmailLog
     *   }
     * })
     * 
     */
    create<T extends EmailLogCreateArgs>(args: SelectSubset<T, EmailLogCreateArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EmailLogs.
     * @param {EmailLogCreateManyArgs} args - Arguments to create many EmailLogs.
     * @example
     * // Create many EmailLogs
     * const emailLog = await prisma.emailLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EmailLogCreateManyArgs>(args?: SelectSubset<T, EmailLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EmailLogs and returns the data saved in the database.
     * @param {EmailLogCreateManyAndReturnArgs} args - Arguments to create many EmailLogs.
     * @example
     * // Create many EmailLogs
     * const emailLog = await prisma.emailLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EmailLogs and only return the `id`
     * const emailLogWithIdOnly = await prisma.emailLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EmailLogCreateManyAndReturnArgs>(args?: SelectSubset<T, EmailLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EmailLog.
     * @param {EmailLogDeleteArgs} args - Arguments to delete one EmailLog.
     * @example
     * // Delete one EmailLog
     * const EmailLog = await prisma.emailLog.delete({
     *   where: {
     *     // ... filter to delete one EmailLog
     *   }
     * })
     * 
     */
    delete<T extends EmailLogDeleteArgs>(args: SelectSubset<T, EmailLogDeleteArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EmailLog.
     * @param {EmailLogUpdateArgs} args - Arguments to update one EmailLog.
     * @example
     * // Update one EmailLog
     * const emailLog = await prisma.emailLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EmailLogUpdateArgs>(args: SelectSubset<T, EmailLogUpdateArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EmailLogs.
     * @param {EmailLogDeleteManyArgs} args - Arguments to filter EmailLogs to delete.
     * @example
     * // Delete a few EmailLogs
     * const { count } = await prisma.emailLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EmailLogDeleteManyArgs>(args?: SelectSubset<T, EmailLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EmailLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EmailLogs
     * const emailLog = await prisma.emailLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EmailLogUpdateManyArgs>(args: SelectSubset<T, EmailLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EmailLogs and returns the data updated in the database.
     * @param {EmailLogUpdateManyAndReturnArgs} args - Arguments to update many EmailLogs.
     * @example
     * // Update many EmailLogs
     * const emailLog = await prisma.emailLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EmailLogs and only return the `id`
     * const emailLogWithIdOnly = await prisma.emailLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EmailLogUpdateManyAndReturnArgs>(args: SelectSubset<T, EmailLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EmailLog.
     * @param {EmailLogUpsertArgs} args - Arguments to update or create a EmailLog.
     * @example
     * // Update or create a EmailLog
     * const emailLog = await prisma.emailLog.upsert({
     *   create: {
     *     // ... data to create a EmailLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EmailLog we want to update
     *   }
     * })
     */
    upsert<T extends EmailLogUpsertArgs>(args: SelectSubset<T, EmailLogUpsertArgs<ExtArgs>>): Prisma__EmailLogClient<$Result.GetResult<Prisma.$EmailLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EmailLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogCountArgs} args - Arguments to filter EmailLogs to count.
     * @example
     * // Count the number of EmailLogs
     * const count = await prisma.emailLog.count({
     *   where: {
     *     // ... the filter for the EmailLogs we want to count
     *   }
     * })
    **/
    count<T extends EmailLogCountArgs>(
      args?: Subset<T, EmailLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EmailLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EmailLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EmailLogAggregateArgs>(args: Subset<T, EmailLogAggregateArgs>): Prisma.PrismaPromise<GetEmailLogAggregateType<T>>

    /**
     * Group by EmailLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EmailLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EmailLogGroupByArgs['orderBy'] }
        : { orderBy?: EmailLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EmailLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEmailLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EmailLog model
   */
  readonly fields: EmailLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EmailLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EmailLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EmailLog model
   */
  interface EmailLogFieldRefs {
    readonly id: FieldRef<"EmailLog", 'String'>
    readonly type: FieldRef<"EmailLog", 'String'>
    readonly recipientEmail: FieldRef<"EmailLog", 'String'>
    readonly subject: FieldRef<"EmailLog", 'String'>
    readonly postId: FieldRef<"EmailLog", 'String'>
    readonly subscriberId: FieldRef<"EmailLog", 'String'>
    readonly status: FieldRef<"EmailLog", 'String'>
    readonly error: FieldRef<"EmailLog", 'String'>
    readonly sentAt: FieldRef<"EmailLog", 'DateTime'>
    readonly bodyText: FieldRef<"EmailLog", 'String'>
    readonly bodyHtml: FieldRef<"EmailLog", 'String'>
    readonly attachments: FieldRef<"EmailLog", 'Json'>
    readonly invoiceId: FieldRef<"EmailLog", 'String'>
    readonly provider: FieldRef<"EmailLog", 'String'>
  }
    

  // Custom InputTypes
  /**
   * EmailLog findUnique
   */
  export type EmailLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter, which EmailLog to fetch.
     */
    where: EmailLogWhereUniqueInput
  }

  /**
   * EmailLog findUniqueOrThrow
   */
  export type EmailLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter, which EmailLog to fetch.
     */
    where: EmailLogWhereUniqueInput
  }

  /**
   * EmailLog findFirst
   */
  export type EmailLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter, which EmailLog to fetch.
     */
    where?: EmailLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailLogs to fetch.
     */
    orderBy?: EmailLogOrderByWithRelationInput | EmailLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EmailLogs.
     */
    cursor?: EmailLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EmailLogs.
     */
    distinct?: EmailLogScalarFieldEnum | EmailLogScalarFieldEnum[]
  }

  /**
   * EmailLog findFirstOrThrow
   */
  export type EmailLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter, which EmailLog to fetch.
     */
    where?: EmailLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailLogs to fetch.
     */
    orderBy?: EmailLogOrderByWithRelationInput | EmailLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EmailLogs.
     */
    cursor?: EmailLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EmailLogs.
     */
    distinct?: EmailLogScalarFieldEnum | EmailLogScalarFieldEnum[]
  }

  /**
   * EmailLog findMany
   */
  export type EmailLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter, which EmailLogs to fetch.
     */
    where?: EmailLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailLogs to fetch.
     */
    orderBy?: EmailLogOrderByWithRelationInput | EmailLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EmailLogs.
     */
    cursor?: EmailLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailLogs.
     */
    skip?: number
    distinct?: EmailLogScalarFieldEnum | EmailLogScalarFieldEnum[]
  }

  /**
   * EmailLog create
   */
  export type EmailLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * The data needed to create a EmailLog.
     */
    data: XOR<EmailLogCreateInput, EmailLogUncheckedCreateInput>
  }

  /**
   * EmailLog createMany
   */
  export type EmailLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EmailLogs.
     */
    data: EmailLogCreateManyInput | EmailLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EmailLog createManyAndReturn
   */
  export type EmailLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * The data used to create many EmailLogs.
     */
    data: EmailLogCreateManyInput | EmailLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EmailLog update
   */
  export type EmailLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * The data needed to update a EmailLog.
     */
    data: XOR<EmailLogUpdateInput, EmailLogUncheckedUpdateInput>
    /**
     * Choose, which EmailLog to update.
     */
    where: EmailLogWhereUniqueInput
  }

  /**
   * EmailLog updateMany
   */
  export type EmailLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EmailLogs.
     */
    data: XOR<EmailLogUpdateManyMutationInput, EmailLogUncheckedUpdateManyInput>
    /**
     * Filter which EmailLogs to update
     */
    where?: EmailLogWhereInput
    /**
     * Limit how many EmailLogs to update.
     */
    limit?: number
  }

  /**
   * EmailLog updateManyAndReturn
   */
  export type EmailLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * The data used to update EmailLogs.
     */
    data: XOR<EmailLogUpdateManyMutationInput, EmailLogUncheckedUpdateManyInput>
    /**
     * Filter which EmailLogs to update
     */
    where?: EmailLogWhereInput
    /**
     * Limit how many EmailLogs to update.
     */
    limit?: number
  }

  /**
   * EmailLog upsert
   */
  export type EmailLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * The filter to search for the EmailLog to update in case it exists.
     */
    where: EmailLogWhereUniqueInput
    /**
     * In case the EmailLog found by the `where` argument doesn't exist, create a new EmailLog with this data.
     */
    create: XOR<EmailLogCreateInput, EmailLogUncheckedCreateInput>
    /**
     * In case the EmailLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EmailLogUpdateInput, EmailLogUncheckedUpdateInput>
  }

  /**
   * EmailLog delete
   */
  export type EmailLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
    /**
     * Filter which EmailLog to delete.
     */
    where: EmailLogWhereUniqueInput
  }

  /**
   * EmailLog deleteMany
   */
  export type EmailLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EmailLogs to delete
     */
    where?: EmailLogWhereInput
    /**
     * Limit how many EmailLogs to delete.
     */
    limit?: number
  }

  /**
   * EmailLog without action
   */
  export type EmailLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailLog
     */
    select?: EmailLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailLog
     */
    omit?: EmailLogOmit<ExtArgs> | null
  }


  /**
   * Model EmailProviderConfig
   */

  export type AggregateEmailProviderConfig = {
    _count: EmailProviderConfigCountAggregateOutputType | null
    _avg: EmailProviderConfigAvgAggregateOutputType | null
    _sum: EmailProviderConfigSumAggregateOutputType | null
    _min: EmailProviderConfigMinAggregateOutputType | null
    _max: EmailProviderConfigMaxAggregateOutputType | null
  }

  export type EmailProviderConfigAvgAggregateOutputType = {
    priority: number | null
  }

  export type EmailProviderConfigSumAggregateOutputType = {
    priority: number | null
  }

  export type EmailProviderConfigMinAggregateOutputType = {
    id: string | null
    provider: string | null
    displayName: string | null
    priority: number | null
    enabled: boolean | null
    credentialsEnc: string | null
    lastTestAt: Date | null
    lastTestStatus: string | null
    lastTestError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EmailProviderConfigMaxAggregateOutputType = {
    id: string | null
    provider: string | null
    displayName: string | null
    priority: number | null
    enabled: boolean | null
    credentialsEnc: string | null
    lastTestAt: Date | null
    lastTestStatus: string | null
    lastTestError: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EmailProviderConfigCountAggregateOutputType = {
    id: number
    provider: number
    displayName: number
    priority: number
    enabled: number
    credentialsEnc: number
    lastTestAt: number
    lastTestStatus: number
    lastTestError: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type EmailProviderConfigAvgAggregateInputType = {
    priority?: true
  }

  export type EmailProviderConfigSumAggregateInputType = {
    priority?: true
  }

  export type EmailProviderConfigMinAggregateInputType = {
    id?: true
    provider?: true
    displayName?: true
    priority?: true
    enabled?: true
    credentialsEnc?: true
    lastTestAt?: true
    lastTestStatus?: true
    lastTestError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EmailProviderConfigMaxAggregateInputType = {
    id?: true
    provider?: true
    displayName?: true
    priority?: true
    enabled?: true
    credentialsEnc?: true
    lastTestAt?: true
    lastTestStatus?: true
    lastTestError?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EmailProviderConfigCountAggregateInputType = {
    id?: true
    provider?: true
    displayName?: true
    priority?: true
    enabled?: true
    credentialsEnc?: true
    lastTestAt?: true
    lastTestStatus?: true
    lastTestError?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type EmailProviderConfigAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EmailProviderConfig to aggregate.
     */
    where?: EmailProviderConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailProviderConfigs to fetch.
     */
    orderBy?: EmailProviderConfigOrderByWithRelationInput | EmailProviderConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EmailProviderConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailProviderConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailProviderConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EmailProviderConfigs
    **/
    _count?: true | EmailProviderConfigCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EmailProviderConfigAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EmailProviderConfigSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EmailProviderConfigMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EmailProviderConfigMaxAggregateInputType
  }

  export type GetEmailProviderConfigAggregateType<T extends EmailProviderConfigAggregateArgs> = {
        [P in keyof T & keyof AggregateEmailProviderConfig]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEmailProviderConfig[P]>
      : GetScalarType<T[P], AggregateEmailProviderConfig[P]>
  }




  export type EmailProviderConfigGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EmailProviderConfigWhereInput
    orderBy?: EmailProviderConfigOrderByWithAggregationInput | EmailProviderConfigOrderByWithAggregationInput[]
    by: EmailProviderConfigScalarFieldEnum[] | EmailProviderConfigScalarFieldEnum
    having?: EmailProviderConfigScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EmailProviderConfigCountAggregateInputType | true
    _avg?: EmailProviderConfigAvgAggregateInputType
    _sum?: EmailProviderConfigSumAggregateInputType
    _min?: EmailProviderConfigMinAggregateInputType
    _max?: EmailProviderConfigMaxAggregateInputType
  }

  export type EmailProviderConfigGroupByOutputType = {
    id: string
    provider: string
    displayName: string
    priority: number
    enabled: boolean
    credentialsEnc: string
    lastTestAt: Date | null
    lastTestStatus: string | null
    lastTestError: string | null
    createdAt: Date
    updatedAt: Date
    _count: EmailProviderConfigCountAggregateOutputType | null
    _avg: EmailProviderConfigAvgAggregateOutputType | null
    _sum: EmailProviderConfigSumAggregateOutputType | null
    _min: EmailProviderConfigMinAggregateOutputType | null
    _max: EmailProviderConfigMaxAggregateOutputType | null
  }

  type GetEmailProviderConfigGroupByPayload<T extends EmailProviderConfigGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EmailProviderConfigGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EmailProviderConfigGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EmailProviderConfigGroupByOutputType[P]>
            : GetScalarType<T[P], EmailProviderConfigGroupByOutputType[P]>
        }
      >
    >


  export type EmailProviderConfigSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    provider?: boolean
    displayName?: boolean
    priority?: boolean
    enabled?: boolean
    credentialsEnc?: boolean
    lastTestAt?: boolean
    lastTestStatus?: boolean
    lastTestError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["emailProviderConfig"]>

  export type EmailProviderConfigSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    provider?: boolean
    displayName?: boolean
    priority?: boolean
    enabled?: boolean
    credentialsEnc?: boolean
    lastTestAt?: boolean
    lastTestStatus?: boolean
    lastTestError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["emailProviderConfig"]>

  export type EmailProviderConfigSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    provider?: boolean
    displayName?: boolean
    priority?: boolean
    enabled?: boolean
    credentialsEnc?: boolean
    lastTestAt?: boolean
    lastTestStatus?: boolean
    lastTestError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["emailProviderConfig"]>

  export type EmailProviderConfigSelectScalar = {
    id?: boolean
    provider?: boolean
    displayName?: boolean
    priority?: boolean
    enabled?: boolean
    credentialsEnc?: boolean
    lastTestAt?: boolean
    lastTestStatus?: boolean
    lastTestError?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type EmailProviderConfigOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "provider" | "displayName" | "priority" | "enabled" | "credentialsEnc" | "lastTestAt" | "lastTestStatus" | "lastTestError" | "createdAt" | "updatedAt", ExtArgs["result"]["emailProviderConfig"]>

  export type $EmailProviderConfigPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EmailProviderConfig"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      provider: string
      displayName: string
      priority: number
      enabled: boolean
      credentialsEnc: string
      lastTestAt: Date | null
      lastTestStatus: string | null
      lastTestError: string | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["emailProviderConfig"]>
    composites: {}
  }

  type EmailProviderConfigGetPayload<S extends boolean | null | undefined | EmailProviderConfigDefaultArgs> = $Result.GetResult<Prisma.$EmailProviderConfigPayload, S>

  type EmailProviderConfigCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EmailProviderConfigFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EmailProviderConfigCountAggregateInputType | true
    }

  export interface EmailProviderConfigDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EmailProviderConfig'], meta: { name: 'EmailProviderConfig' } }
    /**
     * Find zero or one EmailProviderConfig that matches the filter.
     * @param {EmailProviderConfigFindUniqueArgs} args - Arguments to find a EmailProviderConfig
     * @example
     * // Get one EmailProviderConfig
     * const emailProviderConfig = await prisma.emailProviderConfig.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EmailProviderConfigFindUniqueArgs>(args: SelectSubset<T, EmailProviderConfigFindUniqueArgs<ExtArgs>>): Prisma__EmailProviderConfigClient<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EmailProviderConfig that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EmailProviderConfigFindUniqueOrThrowArgs} args - Arguments to find a EmailProviderConfig
     * @example
     * // Get one EmailProviderConfig
     * const emailProviderConfig = await prisma.emailProviderConfig.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EmailProviderConfigFindUniqueOrThrowArgs>(args: SelectSubset<T, EmailProviderConfigFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EmailProviderConfigClient<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EmailProviderConfig that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailProviderConfigFindFirstArgs} args - Arguments to find a EmailProviderConfig
     * @example
     * // Get one EmailProviderConfig
     * const emailProviderConfig = await prisma.emailProviderConfig.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EmailProviderConfigFindFirstArgs>(args?: SelectSubset<T, EmailProviderConfigFindFirstArgs<ExtArgs>>): Prisma__EmailProviderConfigClient<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EmailProviderConfig that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailProviderConfigFindFirstOrThrowArgs} args - Arguments to find a EmailProviderConfig
     * @example
     * // Get one EmailProviderConfig
     * const emailProviderConfig = await prisma.emailProviderConfig.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EmailProviderConfigFindFirstOrThrowArgs>(args?: SelectSubset<T, EmailProviderConfigFindFirstOrThrowArgs<ExtArgs>>): Prisma__EmailProviderConfigClient<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EmailProviderConfigs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailProviderConfigFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EmailProviderConfigs
     * const emailProviderConfigs = await prisma.emailProviderConfig.findMany()
     * 
     * // Get first 10 EmailProviderConfigs
     * const emailProviderConfigs = await prisma.emailProviderConfig.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const emailProviderConfigWithIdOnly = await prisma.emailProviderConfig.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EmailProviderConfigFindManyArgs>(args?: SelectSubset<T, EmailProviderConfigFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EmailProviderConfig.
     * @param {EmailProviderConfigCreateArgs} args - Arguments to create a EmailProviderConfig.
     * @example
     * // Create one EmailProviderConfig
     * const EmailProviderConfig = await prisma.emailProviderConfig.create({
     *   data: {
     *     // ... data to create a EmailProviderConfig
     *   }
     * })
     * 
     */
    create<T extends EmailProviderConfigCreateArgs>(args: SelectSubset<T, EmailProviderConfigCreateArgs<ExtArgs>>): Prisma__EmailProviderConfigClient<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EmailProviderConfigs.
     * @param {EmailProviderConfigCreateManyArgs} args - Arguments to create many EmailProviderConfigs.
     * @example
     * // Create many EmailProviderConfigs
     * const emailProviderConfig = await prisma.emailProviderConfig.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EmailProviderConfigCreateManyArgs>(args?: SelectSubset<T, EmailProviderConfigCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EmailProviderConfigs and returns the data saved in the database.
     * @param {EmailProviderConfigCreateManyAndReturnArgs} args - Arguments to create many EmailProviderConfigs.
     * @example
     * // Create many EmailProviderConfigs
     * const emailProviderConfig = await prisma.emailProviderConfig.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EmailProviderConfigs and only return the `id`
     * const emailProviderConfigWithIdOnly = await prisma.emailProviderConfig.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EmailProviderConfigCreateManyAndReturnArgs>(args?: SelectSubset<T, EmailProviderConfigCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EmailProviderConfig.
     * @param {EmailProviderConfigDeleteArgs} args - Arguments to delete one EmailProviderConfig.
     * @example
     * // Delete one EmailProviderConfig
     * const EmailProviderConfig = await prisma.emailProviderConfig.delete({
     *   where: {
     *     // ... filter to delete one EmailProviderConfig
     *   }
     * })
     * 
     */
    delete<T extends EmailProviderConfigDeleteArgs>(args: SelectSubset<T, EmailProviderConfigDeleteArgs<ExtArgs>>): Prisma__EmailProviderConfigClient<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EmailProviderConfig.
     * @param {EmailProviderConfigUpdateArgs} args - Arguments to update one EmailProviderConfig.
     * @example
     * // Update one EmailProviderConfig
     * const emailProviderConfig = await prisma.emailProviderConfig.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EmailProviderConfigUpdateArgs>(args: SelectSubset<T, EmailProviderConfigUpdateArgs<ExtArgs>>): Prisma__EmailProviderConfigClient<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EmailProviderConfigs.
     * @param {EmailProviderConfigDeleteManyArgs} args - Arguments to filter EmailProviderConfigs to delete.
     * @example
     * // Delete a few EmailProviderConfigs
     * const { count } = await prisma.emailProviderConfig.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EmailProviderConfigDeleteManyArgs>(args?: SelectSubset<T, EmailProviderConfigDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EmailProviderConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailProviderConfigUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EmailProviderConfigs
     * const emailProviderConfig = await prisma.emailProviderConfig.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EmailProviderConfigUpdateManyArgs>(args: SelectSubset<T, EmailProviderConfigUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EmailProviderConfigs and returns the data updated in the database.
     * @param {EmailProviderConfigUpdateManyAndReturnArgs} args - Arguments to update many EmailProviderConfigs.
     * @example
     * // Update many EmailProviderConfigs
     * const emailProviderConfig = await prisma.emailProviderConfig.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EmailProviderConfigs and only return the `id`
     * const emailProviderConfigWithIdOnly = await prisma.emailProviderConfig.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EmailProviderConfigUpdateManyAndReturnArgs>(args: SelectSubset<T, EmailProviderConfigUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EmailProviderConfig.
     * @param {EmailProviderConfigUpsertArgs} args - Arguments to update or create a EmailProviderConfig.
     * @example
     * // Update or create a EmailProviderConfig
     * const emailProviderConfig = await prisma.emailProviderConfig.upsert({
     *   create: {
     *     // ... data to create a EmailProviderConfig
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EmailProviderConfig we want to update
     *   }
     * })
     */
    upsert<T extends EmailProviderConfigUpsertArgs>(args: SelectSubset<T, EmailProviderConfigUpsertArgs<ExtArgs>>): Prisma__EmailProviderConfigClient<$Result.GetResult<Prisma.$EmailProviderConfigPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EmailProviderConfigs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailProviderConfigCountArgs} args - Arguments to filter EmailProviderConfigs to count.
     * @example
     * // Count the number of EmailProviderConfigs
     * const count = await prisma.emailProviderConfig.count({
     *   where: {
     *     // ... the filter for the EmailProviderConfigs we want to count
     *   }
     * })
    **/
    count<T extends EmailProviderConfigCountArgs>(
      args?: Subset<T, EmailProviderConfigCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EmailProviderConfigCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EmailProviderConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailProviderConfigAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EmailProviderConfigAggregateArgs>(args: Subset<T, EmailProviderConfigAggregateArgs>): Prisma.PrismaPromise<GetEmailProviderConfigAggregateType<T>>

    /**
     * Group by EmailProviderConfig.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EmailProviderConfigGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EmailProviderConfigGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EmailProviderConfigGroupByArgs['orderBy'] }
        : { orderBy?: EmailProviderConfigGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EmailProviderConfigGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEmailProviderConfigGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EmailProviderConfig model
   */
  readonly fields: EmailProviderConfigFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EmailProviderConfig.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EmailProviderConfigClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EmailProviderConfig model
   */
  interface EmailProviderConfigFieldRefs {
    readonly id: FieldRef<"EmailProviderConfig", 'String'>
    readonly provider: FieldRef<"EmailProviderConfig", 'String'>
    readonly displayName: FieldRef<"EmailProviderConfig", 'String'>
    readonly priority: FieldRef<"EmailProviderConfig", 'Int'>
    readonly enabled: FieldRef<"EmailProviderConfig", 'Boolean'>
    readonly credentialsEnc: FieldRef<"EmailProviderConfig", 'String'>
    readonly lastTestAt: FieldRef<"EmailProviderConfig", 'DateTime'>
    readonly lastTestStatus: FieldRef<"EmailProviderConfig", 'String'>
    readonly lastTestError: FieldRef<"EmailProviderConfig", 'String'>
    readonly createdAt: FieldRef<"EmailProviderConfig", 'DateTime'>
    readonly updatedAt: FieldRef<"EmailProviderConfig", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EmailProviderConfig findUnique
   */
  export type EmailProviderConfigFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * Filter, which EmailProviderConfig to fetch.
     */
    where: EmailProviderConfigWhereUniqueInput
  }

  /**
   * EmailProviderConfig findUniqueOrThrow
   */
  export type EmailProviderConfigFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * Filter, which EmailProviderConfig to fetch.
     */
    where: EmailProviderConfigWhereUniqueInput
  }

  /**
   * EmailProviderConfig findFirst
   */
  export type EmailProviderConfigFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * Filter, which EmailProviderConfig to fetch.
     */
    where?: EmailProviderConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailProviderConfigs to fetch.
     */
    orderBy?: EmailProviderConfigOrderByWithRelationInput | EmailProviderConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EmailProviderConfigs.
     */
    cursor?: EmailProviderConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailProviderConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailProviderConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EmailProviderConfigs.
     */
    distinct?: EmailProviderConfigScalarFieldEnum | EmailProviderConfigScalarFieldEnum[]
  }

  /**
   * EmailProviderConfig findFirstOrThrow
   */
  export type EmailProviderConfigFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * Filter, which EmailProviderConfig to fetch.
     */
    where?: EmailProviderConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailProviderConfigs to fetch.
     */
    orderBy?: EmailProviderConfigOrderByWithRelationInput | EmailProviderConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EmailProviderConfigs.
     */
    cursor?: EmailProviderConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailProviderConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailProviderConfigs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EmailProviderConfigs.
     */
    distinct?: EmailProviderConfigScalarFieldEnum | EmailProviderConfigScalarFieldEnum[]
  }

  /**
   * EmailProviderConfig findMany
   */
  export type EmailProviderConfigFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * Filter, which EmailProviderConfigs to fetch.
     */
    where?: EmailProviderConfigWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EmailProviderConfigs to fetch.
     */
    orderBy?: EmailProviderConfigOrderByWithRelationInput | EmailProviderConfigOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EmailProviderConfigs.
     */
    cursor?: EmailProviderConfigWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EmailProviderConfigs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EmailProviderConfigs.
     */
    skip?: number
    distinct?: EmailProviderConfigScalarFieldEnum | EmailProviderConfigScalarFieldEnum[]
  }

  /**
   * EmailProviderConfig create
   */
  export type EmailProviderConfigCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * The data needed to create a EmailProviderConfig.
     */
    data: XOR<EmailProviderConfigCreateInput, EmailProviderConfigUncheckedCreateInput>
  }

  /**
   * EmailProviderConfig createMany
   */
  export type EmailProviderConfigCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EmailProviderConfigs.
     */
    data: EmailProviderConfigCreateManyInput | EmailProviderConfigCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EmailProviderConfig createManyAndReturn
   */
  export type EmailProviderConfigCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * The data used to create many EmailProviderConfigs.
     */
    data: EmailProviderConfigCreateManyInput | EmailProviderConfigCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EmailProviderConfig update
   */
  export type EmailProviderConfigUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * The data needed to update a EmailProviderConfig.
     */
    data: XOR<EmailProviderConfigUpdateInput, EmailProviderConfigUncheckedUpdateInput>
    /**
     * Choose, which EmailProviderConfig to update.
     */
    where: EmailProviderConfigWhereUniqueInput
  }

  /**
   * EmailProviderConfig updateMany
   */
  export type EmailProviderConfigUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EmailProviderConfigs.
     */
    data: XOR<EmailProviderConfigUpdateManyMutationInput, EmailProviderConfigUncheckedUpdateManyInput>
    /**
     * Filter which EmailProviderConfigs to update
     */
    where?: EmailProviderConfigWhereInput
    /**
     * Limit how many EmailProviderConfigs to update.
     */
    limit?: number
  }

  /**
   * EmailProviderConfig updateManyAndReturn
   */
  export type EmailProviderConfigUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * The data used to update EmailProviderConfigs.
     */
    data: XOR<EmailProviderConfigUpdateManyMutationInput, EmailProviderConfigUncheckedUpdateManyInput>
    /**
     * Filter which EmailProviderConfigs to update
     */
    where?: EmailProviderConfigWhereInput
    /**
     * Limit how many EmailProviderConfigs to update.
     */
    limit?: number
  }

  /**
   * EmailProviderConfig upsert
   */
  export type EmailProviderConfigUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * The filter to search for the EmailProviderConfig to update in case it exists.
     */
    where: EmailProviderConfigWhereUniqueInput
    /**
     * In case the EmailProviderConfig found by the `where` argument doesn't exist, create a new EmailProviderConfig with this data.
     */
    create: XOR<EmailProviderConfigCreateInput, EmailProviderConfigUncheckedCreateInput>
    /**
     * In case the EmailProviderConfig was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EmailProviderConfigUpdateInput, EmailProviderConfigUncheckedUpdateInput>
  }

  /**
   * EmailProviderConfig delete
   */
  export type EmailProviderConfigDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
    /**
     * Filter which EmailProviderConfig to delete.
     */
    where: EmailProviderConfigWhereUniqueInput
  }

  /**
   * EmailProviderConfig deleteMany
   */
  export type EmailProviderConfigDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EmailProviderConfigs to delete
     */
    where?: EmailProviderConfigWhereInput
    /**
     * Limit how many EmailProviderConfigs to delete.
     */
    limit?: number
  }

  /**
   * EmailProviderConfig without action
   */
  export type EmailProviderConfigDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EmailProviderConfig
     */
    select?: EmailProviderConfigSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EmailProviderConfig
     */
    omit?: EmailProviderConfigOmit<ExtArgs> | null
  }


  /**
   * Model ReceivedEmail
   */

  export type AggregateReceivedEmail = {
    _count: ReceivedEmailCountAggregateOutputType | null
    _avg: ReceivedEmailAvgAggregateOutputType | null
    _sum: ReceivedEmailSumAggregateOutputType | null
    _min: ReceivedEmailMinAggregateOutputType | null
    _max: ReceivedEmailMaxAggregateOutputType | null
  }

  export type ReceivedEmailAvgAggregateOutputType = {
    leadScore: number | null
  }

  export type ReceivedEmailSumAggregateOutputType = {
    leadScore: number | null
  }

  export type ReceivedEmailMinAggregateOutputType = {
    id: string | null
    source: string | null
    name: string | null
    email: string | null
    phone: string | null
    subject: string | null
    message: string | null
    leadScore: number | null
    inquiryId: string | null
    createdAt: Date | null
  }

  export type ReceivedEmailMaxAggregateOutputType = {
    id: string | null
    source: string | null
    name: string | null
    email: string | null
    phone: string | null
    subject: string | null
    message: string | null
    leadScore: number | null
    inquiryId: string | null
    createdAt: Date | null
  }

  export type ReceivedEmailCountAggregateOutputType = {
    id: number
    source: number
    name: number
    email: number
    phone: number
    subject: number
    message: number
    leadScore: number
    meta: number
    inquiryId: number
    createdAt: number
    _all: number
  }


  export type ReceivedEmailAvgAggregateInputType = {
    leadScore?: true
  }

  export type ReceivedEmailSumAggregateInputType = {
    leadScore?: true
  }

  export type ReceivedEmailMinAggregateInputType = {
    id?: true
    source?: true
    name?: true
    email?: true
    phone?: true
    subject?: true
    message?: true
    leadScore?: true
    inquiryId?: true
    createdAt?: true
  }

  export type ReceivedEmailMaxAggregateInputType = {
    id?: true
    source?: true
    name?: true
    email?: true
    phone?: true
    subject?: true
    message?: true
    leadScore?: true
    inquiryId?: true
    createdAt?: true
  }

  export type ReceivedEmailCountAggregateInputType = {
    id?: true
    source?: true
    name?: true
    email?: true
    phone?: true
    subject?: true
    message?: true
    leadScore?: true
    meta?: true
    inquiryId?: true
    createdAt?: true
    _all?: true
  }

  export type ReceivedEmailAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReceivedEmail to aggregate.
     */
    where?: ReceivedEmailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivedEmails to fetch.
     */
    orderBy?: ReceivedEmailOrderByWithRelationInput | ReceivedEmailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReceivedEmailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivedEmails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivedEmails.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ReceivedEmails
    **/
    _count?: true | ReceivedEmailCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReceivedEmailAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReceivedEmailSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReceivedEmailMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReceivedEmailMaxAggregateInputType
  }

  export type GetReceivedEmailAggregateType<T extends ReceivedEmailAggregateArgs> = {
        [P in keyof T & keyof AggregateReceivedEmail]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReceivedEmail[P]>
      : GetScalarType<T[P], AggregateReceivedEmail[P]>
  }




  export type ReceivedEmailGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReceivedEmailWhereInput
    orderBy?: ReceivedEmailOrderByWithAggregationInput | ReceivedEmailOrderByWithAggregationInput[]
    by: ReceivedEmailScalarFieldEnum[] | ReceivedEmailScalarFieldEnum
    having?: ReceivedEmailScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReceivedEmailCountAggregateInputType | true
    _avg?: ReceivedEmailAvgAggregateInputType
    _sum?: ReceivedEmailSumAggregateInputType
    _min?: ReceivedEmailMinAggregateInputType
    _max?: ReceivedEmailMaxAggregateInputType
  }

  export type ReceivedEmailGroupByOutputType = {
    id: string
    source: string
    name: string | null
    email: string | null
    phone: string | null
    subject: string | null
    message: string
    leadScore: number | null
    meta: JsonValue
    inquiryId: string | null
    createdAt: Date
    _count: ReceivedEmailCountAggregateOutputType | null
    _avg: ReceivedEmailAvgAggregateOutputType | null
    _sum: ReceivedEmailSumAggregateOutputType | null
    _min: ReceivedEmailMinAggregateOutputType | null
    _max: ReceivedEmailMaxAggregateOutputType | null
  }

  type GetReceivedEmailGroupByPayload<T extends ReceivedEmailGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReceivedEmailGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReceivedEmailGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReceivedEmailGroupByOutputType[P]>
            : GetScalarType<T[P], ReceivedEmailGroupByOutputType[P]>
        }
      >
    >


  export type ReceivedEmailSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    subject?: boolean
    message?: boolean
    leadScore?: boolean
    meta?: boolean
    inquiryId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["receivedEmail"]>

  export type ReceivedEmailSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    subject?: boolean
    message?: boolean
    leadScore?: boolean
    meta?: boolean
    inquiryId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["receivedEmail"]>

  export type ReceivedEmailSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    source?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    subject?: boolean
    message?: boolean
    leadScore?: boolean
    meta?: boolean
    inquiryId?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["receivedEmail"]>

  export type ReceivedEmailSelectScalar = {
    id?: boolean
    source?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    subject?: boolean
    message?: boolean
    leadScore?: boolean
    meta?: boolean
    inquiryId?: boolean
    createdAt?: boolean
  }

  export type ReceivedEmailOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "source" | "name" | "email" | "phone" | "subject" | "message" | "leadScore" | "meta" | "inquiryId" | "createdAt", ExtArgs["result"]["receivedEmail"]>

  export type $ReceivedEmailPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ReceivedEmail"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      source: string
      name: string | null
      email: string | null
      phone: string | null
      subject: string | null
      message: string
      leadScore: number | null
      meta: Prisma.JsonValue
      inquiryId: string | null
      createdAt: Date
    }, ExtArgs["result"]["receivedEmail"]>
    composites: {}
  }

  type ReceivedEmailGetPayload<S extends boolean | null | undefined | ReceivedEmailDefaultArgs> = $Result.GetResult<Prisma.$ReceivedEmailPayload, S>

  type ReceivedEmailCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ReceivedEmailFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: ReceivedEmailCountAggregateInputType | true
    }

  export interface ReceivedEmailDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ReceivedEmail'], meta: { name: 'ReceivedEmail' } }
    /**
     * Find zero or one ReceivedEmail that matches the filter.
     * @param {ReceivedEmailFindUniqueArgs} args - Arguments to find a ReceivedEmail
     * @example
     * // Get one ReceivedEmail
     * const receivedEmail = await prisma.receivedEmail.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReceivedEmailFindUniqueArgs>(args: SelectSubset<T, ReceivedEmailFindUniqueArgs<ExtArgs>>): Prisma__ReceivedEmailClient<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ReceivedEmail that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ReceivedEmailFindUniqueOrThrowArgs} args - Arguments to find a ReceivedEmail
     * @example
     * // Get one ReceivedEmail
     * const receivedEmail = await prisma.receivedEmail.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReceivedEmailFindUniqueOrThrowArgs>(args: SelectSubset<T, ReceivedEmailFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReceivedEmailClient<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ReceivedEmail that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivedEmailFindFirstArgs} args - Arguments to find a ReceivedEmail
     * @example
     * // Get one ReceivedEmail
     * const receivedEmail = await prisma.receivedEmail.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReceivedEmailFindFirstArgs>(args?: SelectSubset<T, ReceivedEmailFindFirstArgs<ExtArgs>>): Prisma__ReceivedEmailClient<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ReceivedEmail that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivedEmailFindFirstOrThrowArgs} args - Arguments to find a ReceivedEmail
     * @example
     * // Get one ReceivedEmail
     * const receivedEmail = await prisma.receivedEmail.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReceivedEmailFindFirstOrThrowArgs>(args?: SelectSubset<T, ReceivedEmailFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReceivedEmailClient<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ReceivedEmails that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivedEmailFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ReceivedEmails
     * const receivedEmails = await prisma.receivedEmail.findMany()
     * 
     * // Get first 10 ReceivedEmails
     * const receivedEmails = await prisma.receivedEmail.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const receivedEmailWithIdOnly = await prisma.receivedEmail.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReceivedEmailFindManyArgs>(args?: SelectSubset<T, ReceivedEmailFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ReceivedEmail.
     * @param {ReceivedEmailCreateArgs} args - Arguments to create a ReceivedEmail.
     * @example
     * // Create one ReceivedEmail
     * const ReceivedEmail = await prisma.receivedEmail.create({
     *   data: {
     *     // ... data to create a ReceivedEmail
     *   }
     * })
     * 
     */
    create<T extends ReceivedEmailCreateArgs>(args: SelectSubset<T, ReceivedEmailCreateArgs<ExtArgs>>): Prisma__ReceivedEmailClient<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ReceivedEmails.
     * @param {ReceivedEmailCreateManyArgs} args - Arguments to create many ReceivedEmails.
     * @example
     * // Create many ReceivedEmails
     * const receivedEmail = await prisma.receivedEmail.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReceivedEmailCreateManyArgs>(args?: SelectSubset<T, ReceivedEmailCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ReceivedEmails and returns the data saved in the database.
     * @param {ReceivedEmailCreateManyAndReturnArgs} args - Arguments to create many ReceivedEmails.
     * @example
     * // Create many ReceivedEmails
     * const receivedEmail = await prisma.receivedEmail.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ReceivedEmails and only return the `id`
     * const receivedEmailWithIdOnly = await prisma.receivedEmail.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReceivedEmailCreateManyAndReturnArgs>(args?: SelectSubset<T, ReceivedEmailCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ReceivedEmail.
     * @param {ReceivedEmailDeleteArgs} args - Arguments to delete one ReceivedEmail.
     * @example
     * // Delete one ReceivedEmail
     * const ReceivedEmail = await prisma.receivedEmail.delete({
     *   where: {
     *     // ... filter to delete one ReceivedEmail
     *   }
     * })
     * 
     */
    delete<T extends ReceivedEmailDeleteArgs>(args: SelectSubset<T, ReceivedEmailDeleteArgs<ExtArgs>>): Prisma__ReceivedEmailClient<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ReceivedEmail.
     * @param {ReceivedEmailUpdateArgs} args - Arguments to update one ReceivedEmail.
     * @example
     * // Update one ReceivedEmail
     * const receivedEmail = await prisma.receivedEmail.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReceivedEmailUpdateArgs>(args: SelectSubset<T, ReceivedEmailUpdateArgs<ExtArgs>>): Prisma__ReceivedEmailClient<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ReceivedEmails.
     * @param {ReceivedEmailDeleteManyArgs} args - Arguments to filter ReceivedEmails to delete.
     * @example
     * // Delete a few ReceivedEmails
     * const { count } = await prisma.receivedEmail.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReceivedEmailDeleteManyArgs>(args?: SelectSubset<T, ReceivedEmailDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReceivedEmails.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivedEmailUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ReceivedEmails
     * const receivedEmail = await prisma.receivedEmail.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReceivedEmailUpdateManyArgs>(args: SelectSubset<T, ReceivedEmailUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReceivedEmails and returns the data updated in the database.
     * @param {ReceivedEmailUpdateManyAndReturnArgs} args - Arguments to update many ReceivedEmails.
     * @example
     * // Update many ReceivedEmails
     * const receivedEmail = await prisma.receivedEmail.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ReceivedEmails and only return the `id`
     * const receivedEmailWithIdOnly = await prisma.receivedEmail.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ReceivedEmailUpdateManyAndReturnArgs>(args: SelectSubset<T, ReceivedEmailUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ReceivedEmail.
     * @param {ReceivedEmailUpsertArgs} args - Arguments to update or create a ReceivedEmail.
     * @example
     * // Update or create a ReceivedEmail
     * const receivedEmail = await prisma.receivedEmail.upsert({
     *   create: {
     *     // ... data to create a ReceivedEmail
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ReceivedEmail we want to update
     *   }
     * })
     */
    upsert<T extends ReceivedEmailUpsertArgs>(args: SelectSubset<T, ReceivedEmailUpsertArgs<ExtArgs>>): Prisma__ReceivedEmailClient<$Result.GetResult<Prisma.$ReceivedEmailPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ReceivedEmails.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivedEmailCountArgs} args - Arguments to filter ReceivedEmails to count.
     * @example
     * // Count the number of ReceivedEmails
     * const count = await prisma.receivedEmail.count({
     *   where: {
     *     // ... the filter for the ReceivedEmails we want to count
     *   }
     * })
    **/
    count<T extends ReceivedEmailCountArgs>(
      args?: Subset<T, ReceivedEmailCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReceivedEmailCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ReceivedEmail.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivedEmailAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ReceivedEmailAggregateArgs>(args: Subset<T, ReceivedEmailAggregateArgs>): Prisma.PrismaPromise<GetReceivedEmailAggregateType<T>>

    /**
     * Group by ReceivedEmail.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReceivedEmailGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ReceivedEmailGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReceivedEmailGroupByArgs['orderBy'] }
        : { orderBy?: ReceivedEmailGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ReceivedEmailGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReceivedEmailGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ReceivedEmail model
   */
  readonly fields: ReceivedEmailFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ReceivedEmail.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReceivedEmailClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ReceivedEmail model
   */
  interface ReceivedEmailFieldRefs {
    readonly id: FieldRef<"ReceivedEmail", 'String'>
    readonly source: FieldRef<"ReceivedEmail", 'String'>
    readonly name: FieldRef<"ReceivedEmail", 'String'>
    readonly email: FieldRef<"ReceivedEmail", 'String'>
    readonly phone: FieldRef<"ReceivedEmail", 'String'>
    readonly subject: FieldRef<"ReceivedEmail", 'String'>
    readonly message: FieldRef<"ReceivedEmail", 'String'>
    readonly leadScore: FieldRef<"ReceivedEmail", 'Int'>
    readonly meta: FieldRef<"ReceivedEmail", 'Json'>
    readonly inquiryId: FieldRef<"ReceivedEmail", 'String'>
    readonly createdAt: FieldRef<"ReceivedEmail", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ReceivedEmail findUnique
   */
  export type ReceivedEmailFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * Filter, which ReceivedEmail to fetch.
     */
    where: ReceivedEmailWhereUniqueInput
  }

  /**
   * ReceivedEmail findUniqueOrThrow
   */
  export type ReceivedEmailFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * Filter, which ReceivedEmail to fetch.
     */
    where: ReceivedEmailWhereUniqueInput
  }

  /**
   * ReceivedEmail findFirst
   */
  export type ReceivedEmailFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * Filter, which ReceivedEmail to fetch.
     */
    where?: ReceivedEmailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivedEmails to fetch.
     */
    orderBy?: ReceivedEmailOrderByWithRelationInput | ReceivedEmailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReceivedEmails.
     */
    cursor?: ReceivedEmailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivedEmails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivedEmails.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReceivedEmails.
     */
    distinct?: ReceivedEmailScalarFieldEnum | ReceivedEmailScalarFieldEnum[]
  }

  /**
   * ReceivedEmail findFirstOrThrow
   */
  export type ReceivedEmailFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * Filter, which ReceivedEmail to fetch.
     */
    where?: ReceivedEmailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivedEmails to fetch.
     */
    orderBy?: ReceivedEmailOrderByWithRelationInput | ReceivedEmailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReceivedEmails.
     */
    cursor?: ReceivedEmailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivedEmails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivedEmails.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReceivedEmails.
     */
    distinct?: ReceivedEmailScalarFieldEnum | ReceivedEmailScalarFieldEnum[]
  }

  /**
   * ReceivedEmail findMany
   */
  export type ReceivedEmailFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * Filter, which ReceivedEmails to fetch.
     */
    where?: ReceivedEmailWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReceivedEmails to fetch.
     */
    orderBy?: ReceivedEmailOrderByWithRelationInput | ReceivedEmailOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ReceivedEmails.
     */
    cursor?: ReceivedEmailWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReceivedEmails from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReceivedEmails.
     */
    skip?: number
    distinct?: ReceivedEmailScalarFieldEnum | ReceivedEmailScalarFieldEnum[]
  }

  /**
   * ReceivedEmail create
   */
  export type ReceivedEmailCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * The data needed to create a ReceivedEmail.
     */
    data: XOR<ReceivedEmailCreateInput, ReceivedEmailUncheckedCreateInput>
  }

  /**
   * ReceivedEmail createMany
   */
  export type ReceivedEmailCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ReceivedEmails.
     */
    data: ReceivedEmailCreateManyInput | ReceivedEmailCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReceivedEmail createManyAndReturn
   */
  export type ReceivedEmailCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * The data used to create many ReceivedEmails.
     */
    data: ReceivedEmailCreateManyInput | ReceivedEmailCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReceivedEmail update
   */
  export type ReceivedEmailUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * The data needed to update a ReceivedEmail.
     */
    data: XOR<ReceivedEmailUpdateInput, ReceivedEmailUncheckedUpdateInput>
    /**
     * Choose, which ReceivedEmail to update.
     */
    where: ReceivedEmailWhereUniqueInput
  }

  /**
   * ReceivedEmail updateMany
   */
  export type ReceivedEmailUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ReceivedEmails.
     */
    data: XOR<ReceivedEmailUpdateManyMutationInput, ReceivedEmailUncheckedUpdateManyInput>
    /**
     * Filter which ReceivedEmails to update
     */
    where?: ReceivedEmailWhereInput
    /**
     * Limit how many ReceivedEmails to update.
     */
    limit?: number
  }

  /**
   * ReceivedEmail updateManyAndReturn
   */
  export type ReceivedEmailUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * The data used to update ReceivedEmails.
     */
    data: XOR<ReceivedEmailUpdateManyMutationInput, ReceivedEmailUncheckedUpdateManyInput>
    /**
     * Filter which ReceivedEmails to update
     */
    where?: ReceivedEmailWhereInput
    /**
     * Limit how many ReceivedEmails to update.
     */
    limit?: number
  }

  /**
   * ReceivedEmail upsert
   */
  export type ReceivedEmailUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * The filter to search for the ReceivedEmail to update in case it exists.
     */
    where: ReceivedEmailWhereUniqueInput
    /**
     * In case the ReceivedEmail found by the `where` argument doesn't exist, create a new ReceivedEmail with this data.
     */
    create: XOR<ReceivedEmailCreateInput, ReceivedEmailUncheckedCreateInput>
    /**
     * In case the ReceivedEmail was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReceivedEmailUpdateInput, ReceivedEmailUncheckedUpdateInput>
  }

  /**
   * ReceivedEmail delete
   */
  export type ReceivedEmailDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
    /**
     * Filter which ReceivedEmail to delete.
     */
    where: ReceivedEmailWhereUniqueInput
  }

  /**
   * ReceivedEmail deleteMany
   */
  export type ReceivedEmailDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReceivedEmails to delete
     */
    where?: ReceivedEmailWhereInput
    /**
     * Limit how many ReceivedEmails to delete.
     */
    limit?: number
  }

  /**
   * ReceivedEmail without action
   */
  export type ReceivedEmailDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReceivedEmail
     */
    select?: ReceivedEmailSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReceivedEmail
     */
    omit?: ReceivedEmailOmit<ExtArgs> | null
  }


  /**
   * Model Invoice
   */

  export type AggregateInvoice = {
    _count: InvoiceCountAggregateOutputType | null
    _avg: InvoiceAvgAggregateOutputType | null
    _sum: InvoiceSumAggregateOutputType | null
    _min: InvoiceMinAggregateOutputType | null
    _max: InvoiceMaxAggregateOutputType | null
  }

  export type InvoiceAvgAggregateOutputType = {
    amountKobo: number | null
  }

  export type InvoiceSumAggregateOutputType = {
    amountKobo: number | null
  }

  export type InvoiceMinAggregateOutputType = {
    id: string | null
    invoiceNumber: string | null
    inquiryId: string | null
    customerName: string | null
    customerEmail: string | null
    customerPhone: string | null
    service: string | null
    description: string | null
    amountKobo: number | null
    currency: string | null
    durationLabel: string | null
    dueDate: Date | null
    status: string | null
    dvaAccountNumber: string | null
    dvaBankName: string | null
    dvaBankCode: string | null
    paystackReference: string | null
    pdfUrl: string | null
    pdfStorage: string | null
    secureToken: string | null
    portalViewedAt: Date | null
    paymentProofUrl: string | null
    paymentProofName: string | null
    paymentProofUploadedAt: Date | null
    paidAt: Date | null
    sentAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvoiceMaxAggregateOutputType = {
    id: string | null
    invoiceNumber: string | null
    inquiryId: string | null
    customerName: string | null
    customerEmail: string | null
    customerPhone: string | null
    service: string | null
    description: string | null
    amountKobo: number | null
    currency: string | null
    durationLabel: string | null
    dueDate: Date | null
    status: string | null
    dvaAccountNumber: string | null
    dvaBankName: string | null
    dvaBankCode: string | null
    paystackReference: string | null
    pdfUrl: string | null
    pdfStorage: string | null
    secureToken: string | null
    portalViewedAt: Date | null
    paymentProofUrl: string | null
    paymentProofName: string | null
    paymentProofUploadedAt: Date | null
    paidAt: Date | null
    sentAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type InvoiceCountAggregateOutputType = {
    id: number
    invoiceNumber: number
    inquiryId: number
    customerName: number
    customerEmail: number
    customerPhone: number
    service: number
    description: number
    proposalJson: number
    amountKobo: number
    currency: number
    durationLabel: number
    dueDate: number
    status: number
    dvaAccountNumber: number
    dvaBankName: number
    dvaBankCode: number
    paystackReference: number
    pdfUrl: number
    pdfStorage: number
    secureToken: number
    portalViewedAt: number
    paymentProofUrl: number
    paymentProofName: number
    paymentProofUploadedAt: number
    paidAt: number
    sentAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type InvoiceAvgAggregateInputType = {
    amountKobo?: true
  }

  export type InvoiceSumAggregateInputType = {
    amountKobo?: true
  }

  export type InvoiceMinAggregateInputType = {
    id?: true
    invoiceNumber?: true
    inquiryId?: true
    customerName?: true
    customerEmail?: true
    customerPhone?: true
    service?: true
    description?: true
    amountKobo?: true
    currency?: true
    durationLabel?: true
    dueDate?: true
    status?: true
    dvaAccountNumber?: true
    dvaBankName?: true
    dvaBankCode?: true
    paystackReference?: true
    pdfUrl?: true
    pdfStorage?: true
    secureToken?: true
    portalViewedAt?: true
    paymentProofUrl?: true
    paymentProofName?: true
    paymentProofUploadedAt?: true
    paidAt?: true
    sentAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvoiceMaxAggregateInputType = {
    id?: true
    invoiceNumber?: true
    inquiryId?: true
    customerName?: true
    customerEmail?: true
    customerPhone?: true
    service?: true
    description?: true
    amountKobo?: true
    currency?: true
    durationLabel?: true
    dueDate?: true
    status?: true
    dvaAccountNumber?: true
    dvaBankName?: true
    dvaBankCode?: true
    paystackReference?: true
    pdfUrl?: true
    pdfStorage?: true
    secureToken?: true
    portalViewedAt?: true
    paymentProofUrl?: true
    paymentProofName?: true
    paymentProofUploadedAt?: true
    paidAt?: true
    sentAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type InvoiceCountAggregateInputType = {
    id?: true
    invoiceNumber?: true
    inquiryId?: true
    customerName?: true
    customerEmail?: true
    customerPhone?: true
    service?: true
    description?: true
    proposalJson?: true
    amountKobo?: true
    currency?: true
    durationLabel?: true
    dueDate?: true
    status?: true
    dvaAccountNumber?: true
    dvaBankName?: true
    dvaBankCode?: true
    paystackReference?: true
    pdfUrl?: true
    pdfStorage?: true
    secureToken?: true
    portalViewedAt?: true
    paymentProofUrl?: true
    paymentProofName?: true
    paymentProofUploadedAt?: true
    paidAt?: true
    sentAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type InvoiceAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Invoice to aggregate.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Invoices
    **/
    _count?: true | InvoiceCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: InvoiceAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: InvoiceSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: InvoiceMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: InvoiceMaxAggregateInputType
  }

  export type GetInvoiceAggregateType<T extends InvoiceAggregateArgs> = {
        [P in keyof T & keyof AggregateInvoice]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInvoice[P]>
      : GetScalarType<T[P], AggregateInvoice[P]>
  }




  export type InvoiceGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: InvoiceWhereInput
    orderBy?: InvoiceOrderByWithAggregationInput | InvoiceOrderByWithAggregationInput[]
    by: InvoiceScalarFieldEnum[] | InvoiceScalarFieldEnum
    having?: InvoiceScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: InvoiceCountAggregateInputType | true
    _avg?: InvoiceAvgAggregateInputType
    _sum?: InvoiceSumAggregateInputType
    _min?: InvoiceMinAggregateInputType
    _max?: InvoiceMaxAggregateInputType
  }

  export type InvoiceGroupByOutputType = {
    id: string
    invoiceNumber: string
    inquiryId: string | null
    customerName: string
    customerEmail: string
    customerPhone: string | null
    service: string
    description: string | null
    proposalJson: JsonValue | null
    amountKobo: number
    currency: string
    durationLabel: string | null
    dueDate: Date | null
    status: string
    dvaAccountNumber: string | null
    dvaBankName: string | null
    dvaBankCode: string | null
    paystackReference: string | null
    pdfUrl: string | null
    pdfStorage: string | null
    secureToken: string | null
    portalViewedAt: Date | null
    paymentProofUrl: string | null
    paymentProofName: string | null
    paymentProofUploadedAt: Date | null
    paidAt: Date | null
    sentAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: InvoiceCountAggregateOutputType | null
    _avg: InvoiceAvgAggregateOutputType | null
    _sum: InvoiceSumAggregateOutputType | null
    _min: InvoiceMinAggregateOutputType | null
    _max: InvoiceMaxAggregateOutputType | null
  }

  type GetInvoiceGroupByPayload<T extends InvoiceGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InvoiceGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof InvoiceGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InvoiceGroupByOutputType[P]>
            : GetScalarType<T[P], InvoiceGroupByOutputType[P]>
        }
      >
    >


  export type InvoiceSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invoiceNumber?: boolean
    inquiryId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    customerPhone?: boolean
    service?: boolean
    description?: boolean
    proposalJson?: boolean
    amountKobo?: boolean
    currency?: boolean
    durationLabel?: boolean
    dueDate?: boolean
    status?: boolean
    dvaAccountNumber?: boolean
    dvaBankName?: boolean
    dvaBankCode?: boolean
    paystackReference?: boolean
    pdfUrl?: boolean
    pdfStorage?: boolean
    secureToken?: boolean
    portalViewedAt?: boolean
    paymentProofUrl?: boolean
    paymentProofName?: boolean
    paymentProofUploadedAt?: boolean
    paidAt?: boolean
    sentAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invoiceNumber?: boolean
    inquiryId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    customerPhone?: boolean
    service?: boolean
    description?: boolean
    proposalJson?: boolean
    amountKobo?: boolean
    currency?: boolean
    durationLabel?: boolean
    dueDate?: boolean
    status?: boolean
    dvaAccountNumber?: boolean
    dvaBankName?: boolean
    dvaBankCode?: boolean
    paystackReference?: boolean
    pdfUrl?: boolean
    pdfStorage?: boolean
    secureToken?: boolean
    portalViewedAt?: boolean
    paymentProofUrl?: boolean
    paymentProofName?: boolean
    paymentProofUploadedAt?: boolean
    paidAt?: boolean
    sentAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    invoiceNumber?: boolean
    inquiryId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    customerPhone?: boolean
    service?: boolean
    description?: boolean
    proposalJson?: boolean
    amountKobo?: boolean
    currency?: boolean
    durationLabel?: boolean
    dueDate?: boolean
    status?: boolean
    dvaAccountNumber?: boolean
    dvaBankName?: boolean
    dvaBankCode?: boolean
    paystackReference?: boolean
    pdfUrl?: boolean
    pdfStorage?: boolean
    secureToken?: boolean
    portalViewedAt?: boolean
    paymentProofUrl?: boolean
    paymentProofName?: boolean
    paymentProofUploadedAt?: boolean
    paidAt?: boolean
    sentAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["invoice"]>

  export type InvoiceSelectScalar = {
    id?: boolean
    invoiceNumber?: boolean
    inquiryId?: boolean
    customerName?: boolean
    customerEmail?: boolean
    customerPhone?: boolean
    service?: boolean
    description?: boolean
    proposalJson?: boolean
    amountKobo?: boolean
    currency?: boolean
    durationLabel?: boolean
    dueDate?: boolean
    status?: boolean
    dvaAccountNumber?: boolean
    dvaBankName?: boolean
    dvaBankCode?: boolean
    paystackReference?: boolean
    pdfUrl?: boolean
    pdfStorage?: boolean
    secureToken?: boolean
    portalViewedAt?: boolean
    paymentProofUrl?: boolean
    paymentProofName?: boolean
    paymentProofUploadedAt?: boolean
    paidAt?: boolean
    sentAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type InvoiceOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "invoiceNumber" | "inquiryId" | "customerName" | "customerEmail" | "customerPhone" | "service" | "description" | "proposalJson" | "amountKobo" | "currency" | "durationLabel" | "dueDate" | "status" | "dvaAccountNumber" | "dvaBankName" | "dvaBankCode" | "paystackReference" | "pdfUrl" | "pdfStorage" | "secureToken" | "portalViewedAt" | "paymentProofUrl" | "paymentProofName" | "paymentProofUploadedAt" | "paidAt" | "sentAt" | "createdAt" | "updatedAt", ExtArgs["result"]["invoice"]>

  export type $InvoicePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Invoice"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      invoiceNumber: string
      inquiryId: string | null
      customerName: string
      customerEmail: string
      customerPhone: string | null
      service: string
      description: string | null
      proposalJson: Prisma.JsonValue | null
      amountKobo: number
      currency: string
      durationLabel: string | null
      dueDate: Date | null
      status: string
      dvaAccountNumber: string | null
      dvaBankName: string | null
      dvaBankCode: string | null
      paystackReference: string | null
      pdfUrl: string | null
      pdfStorage: string | null
      secureToken: string | null
      portalViewedAt: Date | null
      paymentProofUrl: string | null
      paymentProofName: string | null
      paymentProofUploadedAt: Date | null
      paidAt: Date | null
      sentAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["invoice"]>
    composites: {}
  }

  type InvoiceGetPayload<S extends boolean | null | undefined | InvoiceDefaultArgs> = $Result.GetResult<Prisma.$InvoicePayload, S>

  type InvoiceCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<InvoiceFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: InvoiceCountAggregateInputType | true
    }

  export interface InvoiceDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Invoice'], meta: { name: 'Invoice' } }
    /**
     * Find zero or one Invoice that matches the filter.
     * @param {InvoiceFindUniqueArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InvoiceFindUniqueArgs>(args: SelectSubset<T, InvoiceFindUniqueArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Invoice that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InvoiceFindUniqueOrThrowArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InvoiceFindUniqueOrThrowArgs>(args: SelectSubset<T, InvoiceFindUniqueOrThrowArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Invoice that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindFirstArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InvoiceFindFirstArgs>(args?: SelectSubset<T, InvoiceFindFirstArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Invoice that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindFirstOrThrowArgs} args - Arguments to find a Invoice
     * @example
     * // Get one Invoice
     * const invoice = await prisma.invoice.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InvoiceFindFirstOrThrowArgs>(args?: SelectSubset<T, InvoiceFindFirstOrThrowArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Invoices that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Invoices
     * const invoices = await prisma.invoice.findMany()
     * 
     * // Get first 10 Invoices
     * const invoices = await prisma.invoice.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const invoiceWithIdOnly = await prisma.invoice.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends InvoiceFindManyArgs>(args?: SelectSubset<T, InvoiceFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Invoice.
     * @param {InvoiceCreateArgs} args - Arguments to create a Invoice.
     * @example
     * // Create one Invoice
     * const Invoice = await prisma.invoice.create({
     *   data: {
     *     // ... data to create a Invoice
     *   }
     * })
     * 
     */
    create<T extends InvoiceCreateArgs>(args: SelectSubset<T, InvoiceCreateArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Invoices.
     * @param {InvoiceCreateManyArgs} args - Arguments to create many Invoices.
     * @example
     * // Create many Invoices
     * const invoice = await prisma.invoice.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends InvoiceCreateManyArgs>(args?: SelectSubset<T, InvoiceCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Invoices and returns the data saved in the database.
     * @param {InvoiceCreateManyAndReturnArgs} args - Arguments to create many Invoices.
     * @example
     * // Create many Invoices
     * const invoice = await prisma.invoice.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Invoices and only return the `id`
     * const invoiceWithIdOnly = await prisma.invoice.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends InvoiceCreateManyAndReturnArgs>(args?: SelectSubset<T, InvoiceCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Invoice.
     * @param {InvoiceDeleteArgs} args - Arguments to delete one Invoice.
     * @example
     * // Delete one Invoice
     * const Invoice = await prisma.invoice.delete({
     *   where: {
     *     // ... filter to delete one Invoice
     *   }
     * })
     * 
     */
    delete<T extends InvoiceDeleteArgs>(args: SelectSubset<T, InvoiceDeleteArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Invoice.
     * @param {InvoiceUpdateArgs} args - Arguments to update one Invoice.
     * @example
     * // Update one Invoice
     * const invoice = await prisma.invoice.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends InvoiceUpdateArgs>(args: SelectSubset<T, InvoiceUpdateArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Invoices.
     * @param {InvoiceDeleteManyArgs} args - Arguments to filter Invoices to delete.
     * @example
     * // Delete a few Invoices
     * const { count } = await prisma.invoice.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends InvoiceDeleteManyArgs>(args?: SelectSubset<T, InvoiceDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Invoices
     * const invoice = await prisma.invoice.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends InvoiceUpdateManyArgs>(args: SelectSubset<T, InvoiceUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Invoices and returns the data updated in the database.
     * @param {InvoiceUpdateManyAndReturnArgs} args - Arguments to update many Invoices.
     * @example
     * // Update many Invoices
     * const invoice = await prisma.invoice.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Invoices and only return the `id`
     * const invoiceWithIdOnly = await prisma.invoice.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends InvoiceUpdateManyAndReturnArgs>(args: SelectSubset<T, InvoiceUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Invoice.
     * @param {InvoiceUpsertArgs} args - Arguments to update or create a Invoice.
     * @example
     * // Update or create a Invoice
     * const invoice = await prisma.invoice.upsert({
     *   create: {
     *     // ... data to create a Invoice
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Invoice we want to update
     *   }
     * })
     */
    upsert<T extends InvoiceUpsertArgs>(args: SelectSubset<T, InvoiceUpsertArgs<ExtArgs>>): Prisma__InvoiceClient<$Result.GetResult<Prisma.$InvoicePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Invoices.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceCountArgs} args - Arguments to filter Invoices to count.
     * @example
     * // Count the number of Invoices
     * const count = await prisma.invoice.count({
     *   where: {
     *     // ... the filter for the Invoices we want to count
     *   }
     * })
    **/
    count<T extends InvoiceCountArgs>(
      args?: Subset<T, InvoiceCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InvoiceCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Invoice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends InvoiceAggregateArgs>(args: Subset<T, InvoiceAggregateArgs>): Prisma.PrismaPromise<GetInvoiceAggregateType<T>>

    /**
     * Group by Invoice.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InvoiceGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends InvoiceGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InvoiceGroupByArgs['orderBy'] }
        : { orderBy?: InvoiceGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, InvoiceGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetInvoiceGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Invoice model
   */
  readonly fields: InvoiceFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Invoice.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InvoiceClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Invoice model
   */
  interface InvoiceFieldRefs {
    readonly id: FieldRef<"Invoice", 'String'>
    readonly invoiceNumber: FieldRef<"Invoice", 'String'>
    readonly inquiryId: FieldRef<"Invoice", 'String'>
    readonly customerName: FieldRef<"Invoice", 'String'>
    readonly customerEmail: FieldRef<"Invoice", 'String'>
    readonly customerPhone: FieldRef<"Invoice", 'String'>
    readonly service: FieldRef<"Invoice", 'String'>
    readonly description: FieldRef<"Invoice", 'String'>
    readonly proposalJson: FieldRef<"Invoice", 'Json'>
    readonly amountKobo: FieldRef<"Invoice", 'Int'>
    readonly currency: FieldRef<"Invoice", 'String'>
    readonly durationLabel: FieldRef<"Invoice", 'String'>
    readonly dueDate: FieldRef<"Invoice", 'DateTime'>
    readonly status: FieldRef<"Invoice", 'String'>
    readonly dvaAccountNumber: FieldRef<"Invoice", 'String'>
    readonly dvaBankName: FieldRef<"Invoice", 'String'>
    readonly dvaBankCode: FieldRef<"Invoice", 'String'>
    readonly paystackReference: FieldRef<"Invoice", 'String'>
    readonly pdfUrl: FieldRef<"Invoice", 'String'>
    readonly pdfStorage: FieldRef<"Invoice", 'String'>
    readonly secureToken: FieldRef<"Invoice", 'String'>
    readonly portalViewedAt: FieldRef<"Invoice", 'DateTime'>
    readonly paymentProofUrl: FieldRef<"Invoice", 'String'>
    readonly paymentProofName: FieldRef<"Invoice", 'String'>
    readonly paymentProofUploadedAt: FieldRef<"Invoice", 'DateTime'>
    readonly paidAt: FieldRef<"Invoice", 'DateTime'>
    readonly sentAt: FieldRef<"Invoice", 'DateTime'>
    readonly createdAt: FieldRef<"Invoice", 'DateTime'>
    readonly updatedAt: FieldRef<"Invoice", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Invoice findUnique
   */
  export type InvoiceFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice findUniqueOrThrow
   */
  export type InvoiceFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice findFirst
   */
  export type InvoiceFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Invoices.
     */
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice findFirstOrThrow
   */
  export type InvoiceFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Filter, which Invoice to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Invoices.
     */
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice findMany
   */
  export type InvoiceFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Filter, which Invoices to fetch.
     */
    where?: InvoiceWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Invoices to fetch.
     */
    orderBy?: InvoiceOrderByWithRelationInput | InvoiceOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Invoices.
     */
    cursor?: InvoiceWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Invoices from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Invoices.
     */
    skip?: number
    distinct?: InvoiceScalarFieldEnum | InvoiceScalarFieldEnum[]
  }

  /**
   * Invoice create
   */
  export type InvoiceCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * The data needed to create a Invoice.
     */
    data: XOR<InvoiceCreateInput, InvoiceUncheckedCreateInput>
  }

  /**
   * Invoice createMany
   */
  export type InvoiceCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Invoices.
     */
    data: InvoiceCreateManyInput | InvoiceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Invoice createManyAndReturn
   */
  export type InvoiceCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * The data used to create many Invoices.
     */
    data: InvoiceCreateManyInput | InvoiceCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Invoice update
   */
  export type InvoiceUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * The data needed to update a Invoice.
     */
    data: XOR<InvoiceUpdateInput, InvoiceUncheckedUpdateInput>
    /**
     * Choose, which Invoice to update.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice updateMany
   */
  export type InvoiceUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Invoices.
     */
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyInput>
    /**
     * Filter which Invoices to update
     */
    where?: InvoiceWhereInput
    /**
     * Limit how many Invoices to update.
     */
    limit?: number
  }

  /**
   * Invoice updateManyAndReturn
   */
  export type InvoiceUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * The data used to update Invoices.
     */
    data: XOR<InvoiceUpdateManyMutationInput, InvoiceUncheckedUpdateManyInput>
    /**
     * Filter which Invoices to update
     */
    where?: InvoiceWhereInput
    /**
     * Limit how many Invoices to update.
     */
    limit?: number
  }

  /**
   * Invoice upsert
   */
  export type InvoiceUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * The filter to search for the Invoice to update in case it exists.
     */
    where: InvoiceWhereUniqueInput
    /**
     * In case the Invoice found by the `where` argument doesn't exist, create a new Invoice with this data.
     */
    create: XOR<InvoiceCreateInput, InvoiceUncheckedCreateInput>
    /**
     * In case the Invoice was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InvoiceUpdateInput, InvoiceUncheckedUpdateInput>
  }

  /**
   * Invoice delete
   */
  export type InvoiceDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
    /**
     * Filter which Invoice to delete.
     */
    where: InvoiceWhereUniqueInput
  }

  /**
   * Invoice deleteMany
   */
  export type InvoiceDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Invoices to delete
     */
    where?: InvoiceWhereInput
    /**
     * Limit how many Invoices to delete.
     */
    limit?: number
  }

  /**
   * Invoice without action
   */
  export type InvoiceDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Invoice
     */
    select?: InvoiceSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Invoice
     */
    omit?: InvoiceOmit<ExtArgs> | null
  }


  /**
   * Model EventRecord
   */

  export type AggregateEventRecord = {
    _count: EventRecordCountAggregateOutputType | null
    _min: EventRecordMinAggregateOutputType | null
    _max: EventRecordMaxAggregateOutputType | null
  }

  export type EventRecordMinAggregateOutputType = {
    id: string | null
    type: string | null
    customerEmail: string | null
    customerPhone: string | null
    eventDate: Date | null
    relatedInvoiceId: string | null
    status: string | null
    processedAt: Date | null
    lastSentAt: Date | null
    createdAt: Date | null
  }

  export type EventRecordMaxAggregateOutputType = {
    id: string | null
    type: string | null
    customerEmail: string | null
    customerPhone: string | null
    eventDate: Date | null
    relatedInvoiceId: string | null
    status: string | null
    processedAt: Date | null
    lastSentAt: Date | null
    createdAt: Date | null
  }

  export type EventRecordCountAggregateOutputType = {
    id: number
    type: number
    customerEmail: number
    customerPhone: number
    eventDate: number
    relatedInvoiceId: number
    payload: number
    status: number
    processedAt: number
    lastSentAt: number
    createdAt: number
    _all: number
  }


  export type EventRecordMinAggregateInputType = {
    id?: true
    type?: true
    customerEmail?: true
    customerPhone?: true
    eventDate?: true
    relatedInvoiceId?: true
    status?: true
    processedAt?: true
    lastSentAt?: true
    createdAt?: true
  }

  export type EventRecordMaxAggregateInputType = {
    id?: true
    type?: true
    customerEmail?: true
    customerPhone?: true
    eventDate?: true
    relatedInvoiceId?: true
    status?: true
    processedAt?: true
    lastSentAt?: true
    createdAt?: true
  }

  export type EventRecordCountAggregateInputType = {
    id?: true
    type?: true
    customerEmail?: true
    customerPhone?: true
    eventDate?: true
    relatedInvoiceId?: true
    payload?: true
    status?: true
    processedAt?: true
    lastSentAt?: true
    createdAt?: true
    _all?: true
  }

  export type EventRecordAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventRecord to aggregate.
     */
    where?: EventRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventRecords to fetch.
     */
    orderBy?: EventRecordOrderByWithRelationInput | EventRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EventRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EventRecords
    **/
    _count?: true | EventRecordCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EventRecordMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EventRecordMaxAggregateInputType
  }

  export type GetEventRecordAggregateType<T extends EventRecordAggregateArgs> = {
        [P in keyof T & keyof AggregateEventRecord]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEventRecord[P]>
      : GetScalarType<T[P], AggregateEventRecord[P]>
  }




  export type EventRecordGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EventRecordWhereInput
    orderBy?: EventRecordOrderByWithAggregationInput | EventRecordOrderByWithAggregationInput[]
    by: EventRecordScalarFieldEnum[] | EventRecordScalarFieldEnum
    having?: EventRecordScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EventRecordCountAggregateInputType | true
    _min?: EventRecordMinAggregateInputType
    _max?: EventRecordMaxAggregateInputType
  }

  export type EventRecordGroupByOutputType = {
    id: string
    type: string
    customerEmail: string | null
    customerPhone: string | null
    eventDate: Date
    relatedInvoiceId: string | null
    payload: JsonValue
    status: string
    processedAt: Date | null
    lastSentAt: Date | null
    createdAt: Date
    _count: EventRecordCountAggregateOutputType | null
    _min: EventRecordMinAggregateOutputType | null
    _max: EventRecordMaxAggregateOutputType | null
  }

  type GetEventRecordGroupByPayload<T extends EventRecordGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EventRecordGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EventRecordGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EventRecordGroupByOutputType[P]>
            : GetScalarType<T[P], EventRecordGroupByOutputType[P]>
        }
      >
    >


  export type EventRecordSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    customerEmail?: boolean
    customerPhone?: boolean
    eventDate?: boolean
    relatedInvoiceId?: boolean
    payload?: boolean
    status?: boolean
    processedAt?: boolean
    lastSentAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["eventRecord"]>

  export type EventRecordSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    customerEmail?: boolean
    customerPhone?: boolean
    eventDate?: boolean
    relatedInvoiceId?: boolean
    payload?: boolean
    status?: boolean
    processedAt?: boolean
    lastSentAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["eventRecord"]>

  export type EventRecordSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    customerEmail?: boolean
    customerPhone?: boolean
    eventDate?: boolean
    relatedInvoiceId?: boolean
    payload?: boolean
    status?: boolean
    processedAt?: boolean
    lastSentAt?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["eventRecord"]>

  export type EventRecordSelectScalar = {
    id?: boolean
    type?: boolean
    customerEmail?: boolean
    customerPhone?: boolean
    eventDate?: boolean
    relatedInvoiceId?: boolean
    payload?: boolean
    status?: boolean
    processedAt?: boolean
    lastSentAt?: boolean
    createdAt?: boolean
  }

  export type EventRecordOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "type" | "customerEmail" | "customerPhone" | "eventDate" | "relatedInvoiceId" | "payload" | "status" | "processedAt" | "lastSentAt" | "createdAt", ExtArgs["result"]["eventRecord"]>

  export type $EventRecordPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EventRecord"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: string
      customerEmail: string | null
      customerPhone: string | null
      eventDate: Date
      relatedInvoiceId: string | null
      payload: Prisma.JsonValue
      status: string
      processedAt: Date | null
      lastSentAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["eventRecord"]>
    composites: {}
  }

  type EventRecordGetPayload<S extends boolean | null | undefined | EventRecordDefaultArgs> = $Result.GetResult<Prisma.$EventRecordPayload, S>

  type EventRecordCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EventRecordFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EventRecordCountAggregateInputType | true
    }

  export interface EventRecordDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EventRecord'], meta: { name: 'EventRecord' } }
    /**
     * Find zero or one EventRecord that matches the filter.
     * @param {EventRecordFindUniqueArgs} args - Arguments to find a EventRecord
     * @example
     * // Get one EventRecord
     * const eventRecord = await prisma.eventRecord.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EventRecordFindUniqueArgs>(args: SelectSubset<T, EventRecordFindUniqueArgs<ExtArgs>>): Prisma__EventRecordClient<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one EventRecord that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EventRecordFindUniqueOrThrowArgs} args - Arguments to find a EventRecord
     * @example
     * // Get one EventRecord
     * const eventRecord = await prisma.eventRecord.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EventRecordFindUniqueOrThrowArgs>(args: SelectSubset<T, EventRecordFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EventRecordClient<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventRecord that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventRecordFindFirstArgs} args - Arguments to find a EventRecord
     * @example
     * // Get one EventRecord
     * const eventRecord = await prisma.eventRecord.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EventRecordFindFirstArgs>(args?: SelectSubset<T, EventRecordFindFirstArgs<ExtArgs>>): Prisma__EventRecordClient<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first EventRecord that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventRecordFindFirstOrThrowArgs} args - Arguments to find a EventRecord
     * @example
     * // Get one EventRecord
     * const eventRecord = await prisma.eventRecord.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EventRecordFindFirstOrThrowArgs>(args?: SelectSubset<T, EventRecordFindFirstOrThrowArgs<ExtArgs>>): Prisma__EventRecordClient<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more EventRecords that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventRecordFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EventRecords
     * const eventRecords = await prisma.eventRecord.findMany()
     * 
     * // Get first 10 EventRecords
     * const eventRecords = await prisma.eventRecord.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const eventRecordWithIdOnly = await prisma.eventRecord.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EventRecordFindManyArgs>(args?: SelectSubset<T, EventRecordFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a EventRecord.
     * @param {EventRecordCreateArgs} args - Arguments to create a EventRecord.
     * @example
     * // Create one EventRecord
     * const EventRecord = await prisma.eventRecord.create({
     *   data: {
     *     // ... data to create a EventRecord
     *   }
     * })
     * 
     */
    create<T extends EventRecordCreateArgs>(args: SelectSubset<T, EventRecordCreateArgs<ExtArgs>>): Prisma__EventRecordClient<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many EventRecords.
     * @param {EventRecordCreateManyArgs} args - Arguments to create many EventRecords.
     * @example
     * // Create many EventRecords
     * const eventRecord = await prisma.eventRecord.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EventRecordCreateManyArgs>(args?: SelectSubset<T, EventRecordCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many EventRecords and returns the data saved in the database.
     * @param {EventRecordCreateManyAndReturnArgs} args - Arguments to create many EventRecords.
     * @example
     * // Create many EventRecords
     * const eventRecord = await prisma.eventRecord.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many EventRecords and only return the `id`
     * const eventRecordWithIdOnly = await prisma.eventRecord.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends EventRecordCreateManyAndReturnArgs>(args?: SelectSubset<T, EventRecordCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a EventRecord.
     * @param {EventRecordDeleteArgs} args - Arguments to delete one EventRecord.
     * @example
     * // Delete one EventRecord
     * const EventRecord = await prisma.eventRecord.delete({
     *   where: {
     *     // ... filter to delete one EventRecord
     *   }
     * })
     * 
     */
    delete<T extends EventRecordDeleteArgs>(args: SelectSubset<T, EventRecordDeleteArgs<ExtArgs>>): Prisma__EventRecordClient<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one EventRecord.
     * @param {EventRecordUpdateArgs} args - Arguments to update one EventRecord.
     * @example
     * // Update one EventRecord
     * const eventRecord = await prisma.eventRecord.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EventRecordUpdateArgs>(args: SelectSubset<T, EventRecordUpdateArgs<ExtArgs>>): Prisma__EventRecordClient<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more EventRecords.
     * @param {EventRecordDeleteManyArgs} args - Arguments to filter EventRecords to delete.
     * @example
     * // Delete a few EventRecords
     * const { count } = await prisma.eventRecord.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EventRecordDeleteManyArgs>(args?: SelectSubset<T, EventRecordDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventRecordUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EventRecords
     * const eventRecord = await prisma.eventRecord.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EventRecordUpdateManyArgs>(args: SelectSubset<T, EventRecordUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EventRecords and returns the data updated in the database.
     * @param {EventRecordUpdateManyAndReturnArgs} args - Arguments to update many EventRecords.
     * @example
     * // Update many EventRecords
     * const eventRecord = await prisma.eventRecord.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more EventRecords and only return the `id`
     * const eventRecordWithIdOnly = await prisma.eventRecord.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends EventRecordUpdateManyAndReturnArgs>(args: SelectSubset<T, EventRecordUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one EventRecord.
     * @param {EventRecordUpsertArgs} args - Arguments to update or create a EventRecord.
     * @example
     * // Update or create a EventRecord
     * const eventRecord = await prisma.eventRecord.upsert({
     *   create: {
     *     // ... data to create a EventRecord
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EventRecord we want to update
     *   }
     * })
     */
    upsert<T extends EventRecordUpsertArgs>(args: SelectSubset<T, EventRecordUpsertArgs<ExtArgs>>): Prisma__EventRecordClient<$Result.GetResult<Prisma.$EventRecordPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of EventRecords.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventRecordCountArgs} args - Arguments to filter EventRecords to count.
     * @example
     * // Count the number of EventRecords
     * const count = await prisma.eventRecord.count({
     *   where: {
     *     // ... the filter for the EventRecords we want to count
     *   }
     * })
    **/
    count<T extends EventRecordCountArgs>(
      args?: Subset<T, EventRecordCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EventRecordCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EventRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventRecordAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EventRecordAggregateArgs>(args: Subset<T, EventRecordAggregateArgs>): Prisma.PrismaPromise<GetEventRecordAggregateType<T>>

    /**
     * Group by EventRecord.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EventRecordGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EventRecordGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EventRecordGroupByArgs['orderBy'] }
        : { orderBy?: EventRecordGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EventRecordGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEventRecordGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EventRecord model
   */
  readonly fields: EventRecordFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EventRecord.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EventRecordClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EventRecord model
   */
  interface EventRecordFieldRefs {
    readonly id: FieldRef<"EventRecord", 'String'>
    readonly type: FieldRef<"EventRecord", 'String'>
    readonly customerEmail: FieldRef<"EventRecord", 'String'>
    readonly customerPhone: FieldRef<"EventRecord", 'String'>
    readonly eventDate: FieldRef<"EventRecord", 'DateTime'>
    readonly relatedInvoiceId: FieldRef<"EventRecord", 'String'>
    readonly payload: FieldRef<"EventRecord", 'Json'>
    readonly status: FieldRef<"EventRecord", 'String'>
    readonly processedAt: FieldRef<"EventRecord", 'DateTime'>
    readonly lastSentAt: FieldRef<"EventRecord", 'DateTime'>
    readonly createdAt: FieldRef<"EventRecord", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EventRecord findUnique
   */
  export type EventRecordFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * Filter, which EventRecord to fetch.
     */
    where: EventRecordWhereUniqueInput
  }

  /**
   * EventRecord findUniqueOrThrow
   */
  export type EventRecordFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * Filter, which EventRecord to fetch.
     */
    where: EventRecordWhereUniqueInput
  }

  /**
   * EventRecord findFirst
   */
  export type EventRecordFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * Filter, which EventRecord to fetch.
     */
    where?: EventRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventRecords to fetch.
     */
    orderBy?: EventRecordOrderByWithRelationInput | EventRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventRecords.
     */
    cursor?: EventRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventRecords.
     */
    distinct?: EventRecordScalarFieldEnum | EventRecordScalarFieldEnum[]
  }

  /**
   * EventRecord findFirstOrThrow
   */
  export type EventRecordFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * Filter, which EventRecord to fetch.
     */
    where?: EventRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventRecords to fetch.
     */
    orderBy?: EventRecordOrderByWithRelationInput | EventRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EventRecords.
     */
    cursor?: EventRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventRecords.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EventRecords.
     */
    distinct?: EventRecordScalarFieldEnum | EventRecordScalarFieldEnum[]
  }

  /**
   * EventRecord findMany
   */
  export type EventRecordFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * Filter, which EventRecords to fetch.
     */
    where?: EventRecordWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EventRecords to fetch.
     */
    orderBy?: EventRecordOrderByWithRelationInput | EventRecordOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EventRecords.
     */
    cursor?: EventRecordWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EventRecords from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EventRecords.
     */
    skip?: number
    distinct?: EventRecordScalarFieldEnum | EventRecordScalarFieldEnum[]
  }

  /**
   * EventRecord create
   */
  export type EventRecordCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * The data needed to create a EventRecord.
     */
    data: XOR<EventRecordCreateInput, EventRecordUncheckedCreateInput>
  }

  /**
   * EventRecord createMany
   */
  export type EventRecordCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EventRecords.
     */
    data: EventRecordCreateManyInput | EventRecordCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventRecord createManyAndReturn
   */
  export type EventRecordCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * The data used to create many EventRecords.
     */
    data: EventRecordCreateManyInput | EventRecordCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EventRecord update
   */
  export type EventRecordUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * The data needed to update a EventRecord.
     */
    data: XOR<EventRecordUpdateInput, EventRecordUncheckedUpdateInput>
    /**
     * Choose, which EventRecord to update.
     */
    where: EventRecordWhereUniqueInput
  }

  /**
   * EventRecord updateMany
   */
  export type EventRecordUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EventRecords.
     */
    data: XOR<EventRecordUpdateManyMutationInput, EventRecordUncheckedUpdateManyInput>
    /**
     * Filter which EventRecords to update
     */
    where?: EventRecordWhereInput
    /**
     * Limit how many EventRecords to update.
     */
    limit?: number
  }

  /**
   * EventRecord updateManyAndReturn
   */
  export type EventRecordUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * The data used to update EventRecords.
     */
    data: XOR<EventRecordUpdateManyMutationInput, EventRecordUncheckedUpdateManyInput>
    /**
     * Filter which EventRecords to update
     */
    where?: EventRecordWhereInput
    /**
     * Limit how many EventRecords to update.
     */
    limit?: number
  }

  /**
   * EventRecord upsert
   */
  export type EventRecordUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * The filter to search for the EventRecord to update in case it exists.
     */
    where: EventRecordWhereUniqueInput
    /**
     * In case the EventRecord found by the `where` argument doesn't exist, create a new EventRecord with this data.
     */
    create: XOR<EventRecordCreateInput, EventRecordUncheckedCreateInput>
    /**
     * In case the EventRecord was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EventRecordUpdateInput, EventRecordUncheckedUpdateInput>
  }

  /**
   * EventRecord delete
   */
  export type EventRecordDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
    /**
     * Filter which EventRecord to delete.
     */
    where: EventRecordWhereUniqueInput
  }

  /**
   * EventRecord deleteMany
   */
  export type EventRecordDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EventRecords to delete
     */
    where?: EventRecordWhereInput
    /**
     * Limit how many EventRecords to delete.
     */
    limit?: number
  }

  /**
   * EventRecord without action
   */
  export type EventRecordDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EventRecord
     */
    select?: EventRecordSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EventRecord
     */
    omit?: EventRecordOmit<ExtArgs> | null
  }


  /**
   * Model WhatsAppMessage
   */

  export type AggregateWhatsAppMessage = {
    _count: WhatsAppMessageCountAggregateOutputType | null
    _min: WhatsAppMessageMinAggregateOutputType | null
    _max: WhatsAppMessageMaxAggregateOutputType | null
  }

  export type WhatsAppMessageMinAggregateOutputType = {
    id: string | null
    direction: string | null
    toPhone: string | null
    fromPhone: string | null
    messageText: string | null
    mediaUrl: string | null
    mediaFilename: string | null
    relatedInvoiceId: string | null
    status: string | null
    sentAt: Date | null
  }

  export type WhatsAppMessageMaxAggregateOutputType = {
    id: string | null
    direction: string | null
    toPhone: string | null
    fromPhone: string | null
    messageText: string | null
    mediaUrl: string | null
    mediaFilename: string | null
    relatedInvoiceId: string | null
    status: string | null
    sentAt: Date | null
  }

  export type WhatsAppMessageCountAggregateOutputType = {
    id: number
    direction: number
    toPhone: number
    fromPhone: number
    messageText: number
    mediaUrl: number
    mediaFilename: number
    relatedInvoiceId: number
    status: number
    sentAt: number
    _all: number
  }


  export type WhatsAppMessageMinAggregateInputType = {
    id?: true
    direction?: true
    toPhone?: true
    fromPhone?: true
    messageText?: true
    mediaUrl?: true
    mediaFilename?: true
    relatedInvoiceId?: true
    status?: true
    sentAt?: true
  }

  export type WhatsAppMessageMaxAggregateInputType = {
    id?: true
    direction?: true
    toPhone?: true
    fromPhone?: true
    messageText?: true
    mediaUrl?: true
    mediaFilename?: true
    relatedInvoiceId?: true
    status?: true
    sentAt?: true
  }

  export type WhatsAppMessageCountAggregateInputType = {
    id?: true
    direction?: true
    toPhone?: true
    fromPhone?: true
    messageText?: true
    mediaUrl?: true
    mediaFilename?: true
    relatedInvoiceId?: true
    status?: true
    sentAt?: true
    _all?: true
  }

  export type WhatsAppMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WhatsAppMessage to aggregate.
     */
    where?: WhatsAppMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WhatsAppMessages to fetch.
     */
    orderBy?: WhatsAppMessageOrderByWithRelationInput | WhatsAppMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WhatsAppMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WhatsAppMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WhatsAppMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned WhatsAppMessages
    **/
    _count?: true | WhatsAppMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WhatsAppMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WhatsAppMessageMaxAggregateInputType
  }

  export type GetWhatsAppMessageAggregateType<T extends WhatsAppMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateWhatsAppMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWhatsAppMessage[P]>
      : GetScalarType<T[P], AggregateWhatsAppMessage[P]>
  }




  export type WhatsAppMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WhatsAppMessageWhereInput
    orderBy?: WhatsAppMessageOrderByWithAggregationInput | WhatsAppMessageOrderByWithAggregationInput[]
    by: WhatsAppMessageScalarFieldEnum[] | WhatsAppMessageScalarFieldEnum
    having?: WhatsAppMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WhatsAppMessageCountAggregateInputType | true
    _min?: WhatsAppMessageMinAggregateInputType
    _max?: WhatsAppMessageMaxAggregateInputType
  }

  export type WhatsAppMessageGroupByOutputType = {
    id: string
    direction: string
    toPhone: string | null
    fromPhone: string | null
    messageText: string | null
    mediaUrl: string | null
    mediaFilename: string | null
    relatedInvoiceId: string | null
    status: string
    sentAt: Date
    _count: WhatsAppMessageCountAggregateOutputType | null
    _min: WhatsAppMessageMinAggregateOutputType | null
    _max: WhatsAppMessageMaxAggregateOutputType | null
  }

  type GetWhatsAppMessageGroupByPayload<T extends WhatsAppMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WhatsAppMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WhatsAppMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WhatsAppMessageGroupByOutputType[P]>
            : GetScalarType<T[P], WhatsAppMessageGroupByOutputType[P]>
        }
      >
    >


  export type WhatsAppMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    direction?: boolean
    toPhone?: boolean
    fromPhone?: boolean
    messageText?: boolean
    mediaUrl?: boolean
    mediaFilename?: boolean
    relatedInvoiceId?: boolean
    status?: boolean
    sentAt?: boolean
  }, ExtArgs["result"]["whatsAppMessage"]>

  export type WhatsAppMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    direction?: boolean
    toPhone?: boolean
    fromPhone?: boolean
    messageText?: boolean
    mediaUrl?: boolean
    mediaFilename?: boolean
    relatedInvoiceId?: boolean
    status?: boolean
    sentAt?: boolean
  }, ExtArgs["result"]["whatsAppMessage"]>

  export type WhatsAppMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    direction?: boolean
    toPhone?: boolean
    fromPhone?: boolean
    messageText?: boolean
    mediaUrl?: boolean
    mediaFilename?: boolean
    relatedInvoiceId?: boolean
    status?: boolean
    sentAt?: boolean
  }, ExtArgs["result"]["whatsAppMessage"]>

  export type WhatsAppMessageSelectScalar = {
    id?: boolean
    direction?: boolean
    toPhone?: boolean
    fromPhone?: boolean
    messageText?: boolean
    mediaUrl?: boolean
    mediaFilename?: boolean
    relatedInvoiceId?: boolean
    status?: boolean
    sentAt?: boolean
  }

  export type WhatsAppMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "direction" | "toPhone" | "fromPhone" | "messageText" | "mediaUrl" | "mediaFilename" | "relatedInvoiceId" | "status" | "sentAt", ExtArgs["result"]["whatsAppMessage"]>

  export type $WhatsAppMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "WhatsAppMessage"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      direction: string
      toPhone: string | null
      fromPhone: string | null
      messageText: string | null
      mediaUrl: string | null
      mediaFilename: string | null
      relatedInvoiceId: string | null
      status: string
      sentAt: Date
    }, ExtArgs["result"]["whatsAppMessage"]>
    composites: {}
  }

  type WhatsAppMessageGetPayload<S extends boolean | null | undefined | WhatsAppMessageDefaultArgs> = $Result.GetResult<Prisma.$WhatsAppMessagePayload, S>

  type WhatsAppMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WhatsAppMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: WhatsAppMessageCountAggregateInputType | true
    }

  export interface WhatsAppMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['WhatsAppMessage'], meta: { name: 'WhatsAppMessage' } }
    /**
     * Find zero or one WhatsAppMessage that matches the filter.
     * @param {WhatsAppMessageFindUniqueArgs} args - Arguments to find a WhatsAppMessage
     * @example
     * // Get one WhatsAppMessage
     * const whatsAppMessage = await prisma.whatsAppMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WhatsAppMessageFindUniqueArgs>(args: SelectSubset<T, WhatsAppMessageFindUniqueArgs<ExtArgs>>): Prisma__WhatsAppMessageClient<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one WhatsAppMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WhatsAppMessageFindUniqueOrThrowArgs} args - Arguments to find a WhatsAppMessage
     * @example
     * // Get one WhatsAppMessage
     * const whatsAppMessage = await prisma.whatsAppMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WhatsAppMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, WhatsAppMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WhatsAppMessageClient<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WhatsAppMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WhatsAppMessageFindFirstArgs} args - Arguments to find a WhatsAppMessage
     * @example
     * // Get one WhatsAppMessage
     * const whatsAppMessage = await prisma.whatsAppMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WhatsAppMessageFindFirstArgs>(args?: SelectSubset<T, WhatsAppMessageFindFirstArgs<ExtArgs>>): Prisma__WhatsAppMessageClient<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first WhatsAppMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WhatsAppMessageFindFirstOrThrowArgs} args - Arguments to find a WhatsAppMessage
     * @example
     * // Get one WhatsAppMessage
     * const whatsAppMessage = await prisma.whatsAppMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WhatsAppMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, WhatsAppMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__WhatsAppMessageClient<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more WhatsAppMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WhatsAppMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all WhatsAppMessages
     * const whatsAppMessages = await prisma.whatsAppMessage.findMany()
     * 
     * // Get first 10 WhatsAppMessages
     * const whatsAppMessages = await prisma.whatsAppMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const whatsAppMessageWithIdOnly = await prisma.whatsAppMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WhatsAppMessageFindManyArgs>(args?: SelectSubset<T, WhatsAppMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a WhatsAppMessage.
     * @param {WhatsAppMessageCreateArgs} args - Arguments to create a WhatsAppMessage.
     * @example
     * // Create one WhatsAppMessage
     * const WhatsAppMessage = await prisma.whatsAppMessage.create({
     *   data: {
     *     // ... data to create a WhatsAppMessage
     *   }
     * })
     * 
     */
    create<T extends WhatsAppMessageCreateArgs>(args: SelectSubset<T, WhatsAppMessageCreateArgs<ExtArgs>>): Prisma__WhatsAppMessageClient<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many WhatsAppMessages.
     * @param {WhatsAppMessageCreateManyArgs} args - Arguments to create many WhatsAppMessages.
     * @example
     * // Create many WhatsAppMessages
     * const whatsAppMessage = await prisma.whatsAppMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WhatsAppMessageCreateManyArgs>(args?: SelectSubset<T, WhatsAppMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many WhatsAppMessages and returns the data saved in the database.
     * @param {WhatsAppMessageCreateManyAndReturnArgs} args - Arguments to create many WhatsAppMessages.
     * @example
     * // Create many WhatsAppMessages
     * const whatsAppMessage = await prisma.whatsAppMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many WhatsAppMessages and only return the `id`
     * const whatsAppMessageWithIdOnly = await prisma.whatsAppMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WhatsAppMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, WhatsAppMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a WhatsAppMessage.
     * @param {WhatsAppMessageDeleteArgs} args - Arguments to delete one WhatsAppMessage.
     * @example
     * // Delete one WhatsAppMessage
     * const WhatsAppMessage = await prisma.whatsAppMessage.delete({
     *   where: {
     *     // ... filter to delete one WhatsAppMessage
     *   }
     * })
     * 
     */
    delete<T extends WhatsAppMessageDeleteArgs>(args: SelectSubset<T, WhatsAppMessageDeleteArgs<ExtArgs>>): Prisma__WhatsAppMessageClient<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one WhatsAppMessage.
     * @param {WhatsAppMessageUpdateArgs} args - Arguments to update one WhatsAppMessage.
     * @example
     * // Update one WhatsAppMessage
     * const whatsAppMessage = await prisma.whatsAppMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WhatsAppMessageUpdateArgs>(args: SelectSubset<T, WhatsAppMessageUpdateArgs<ExtArgs>>): Prisma__WhatsAppMessageClient<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more WhatsAppMessages.
     * @param {WhatsAppMessageDeleteManyArgs} args - Arguments to filter WhatsAppMessages to delete.
     * @example
     * // Delete a few WhatsAppMessages
     * const { count } = await prisma.whatsAppMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WhatsAppMessageDeleteManyArgs>(args?: SelectSubset<T, WhatsAppMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WhatsAppMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WhatsAppMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many WhatsAppMessages
     * const whatsAppMessage = await prisma.whatsAppMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WhatsAppMessageUpdateManyArgs>(args: SelectSubset<T, WhatsAppMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more WhatsAppMessages and returns the data updated in the database.
     * @param {WhatsAppMessageUpdateManyAndReturnArgs} args - Arguments to update many WhatsAppMessages.
     * @example
     * // Update many WhatsAppMessages
     * const whatsAppMessage = await prisma.whatsAppMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more WhatsAppMessages and only return the `id`
     * const whatsAppMessageWithIdOnly = await prisma.whatsAppMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WhatsAppMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, WhatsAppMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one WhatsAppMessage.
     * @param {WhatsAppMessageUpsertArgs} args - Arguments to update or create a WhatsAppMessage.
     * @example
     * // Update or create a WhatsAppMessage
     * const whatsAppMessage = await prisma.whatsAppMessage.upsert({
     *   create: {
     *     // ... data to create a WhatsAppMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the WhatsAppMessage we want to update
     *   }
     * })
     */
    upsert<T extends WhatsAppMessageUpsertArgs>(args: SelectSubset<T, WhatsAppMessageUpsertArgs<ExtArgs>>): Prisma__WhatsAppMessageClient<$Result.GetResult<Prisma.$WhatsAppMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of WhatsAppMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WhatsAppMessageCountArgs} args - Arguments to filter WhatsAppMessages to count.
     * @example
     * // Count the number of WhatsAppMessages
     * const count = await prisma.whatsAppMessage.count({
     *   where: {
     *     // ... the filter for the WhatsAppMessages we want to count
     *   }
     * })
    **/
    count<T extends WhatsAppMessageCountArgs>(
      args?: Subset<T, WhatsAppMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WhatsAppMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a WhatsAppMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WhatsAppMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WhatsAppMessageAggregateArgs>(args: Subset<T, WhatsAppMessageAggregateArgs>): Prisma.PrismaPromise<GetWhatsAppMessageAggregateType<T>>

    /**
     * Group by WhatsAppMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WhatsAppMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WhatsAppMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WhatsAppMessageGroupByArgs['orderBy'] }
        : { orderBy?: WhatsAppMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WhatsAppMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWhatsAppMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the WhatsAppMessage model
   */
  readonly fields: WhatsAppMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for WhatsAppMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WhatsAppMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the WhatsAppMessage model
   */
  interface WhatsAppMessageFieldRefs {
    readonly id: FieldRef<"WhatsAppMessage", 'String'>
    readonly direction: FieldRef<"WhatsAppMessage", 'String'>
    readonly toPhone: FieldRef<"WhatsAppMessage", 'String'>
    readonly fromPhone: FieldRef<"WhatsAppMessage", 'String'>
    readonly messageText: FieldRef<"WhatsAppMessage", 'String'>
    readonly mediaUrl: FieldRef<"WhatsAppMessage", 'String'>
    readonly mediaFilename: FieldRef<"WhatsAppMessage", 'String'>
    readonly relatedInvoiceId: FieldRef<"WhatsAppMessage", 'String'>
    readonly status: FieldRef<"WhatsAppMessage", 'String'>
    readonly sentAt: FieldRef<"WhatsAppMessage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * WhatsAppMessage findUnique
   */
  export type WhatsAppMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * Filter, which WhatsAppMessage to fetch.
     */
    where: WhatsAppMessageWhereUniqueInput
  }

  /**
   * WhatsAppMessage findUniqueOrThrow
   */
  export type WhatsAppMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * Filter, which WhatsAppMessage to fetch.
     */
    where: WhatsAppMessageWhereUniqueInput
  }

  /**
   * WhatsAppMessage findFirst
   */
  export type WhatsAppMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * Filter, which WhatsAppMessage to fetch.
     */
    where?: WhatsAppMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WhatsAppMessages to fetch.
     */
    orderBy?: WhatsAppMessageOrderByWithRelationInput | WhatsAppMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WhatsAppMessages.
     */
    cursor?: WhatsAppMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WhatsAppMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WhatsAppMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WhatsAppMessages.
     */
    distinct?: WhatsAppMessageScalarFieldEnum | WhatsAppMessageScalarFieldEnum[]
  }

  /**
   * WhatsAppMessage findFirstOrThrow
   */
  export type WhatsAppMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * Filter, which WhatsAppMessage to fetch.
     */
    where?: WhatsAppMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WhatsAppMessages to fetch.
     */
    orderBy?: WhatsAppMessageOrderByWithRelationInput | WhatsAppMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for WhatsAppMessages.
     */
    cursor?: WhatsAppMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WhatsAppMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WhatsAppMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of WhatsAppMessages.
     */
    distinct?: WhatsAppMessageScalarFieldEnum | WhatsAppMessageScalarFieldEnum[]
  }

  /**
   * WhatsAppMessage findMany
   */
  export type WhatsAppMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * Filter, which WhatsAppMessages to fetch.
     */
    where?: WhatsAppMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of WhatsAppMessages to fetch.
     */
    orderBy?: WhatsAppMessageOrderByWithRelationInput | WhatsAppMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing WhatsAppMessages.
     */
    cursor?: WhatsAppMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` WhatsAppMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` WhatsAppMessages.
     */
    skip?: number
    distinct?: WhatsAppMessageScalarFieldEnum | WhatsAppMessageScalarFieldEnum[]
  }

  /**
   * WhatsAppMessage create
   */
  export type WhatsAppMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * The data needed to create a WhatsAppMessage.
     */
    data: XOR<WhatsAppMessageCreateInput, WhatsAppMessageUncheckedCreateInput>
  }

  /**
   * WhatsAppMessage createMany
   */
  export type WhatsAppMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many WhatsAppMessages.
     */
    data: WhatsAppMessageCreateManyInput | WhatsAppMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WhatsAppMessage createManyAndReturn
   */
  export type WhatsAppMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * The data used to create many WhatsAppMessages.
     */
    data: WhatsAppMessageCreateManyInput | WhatsAppMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * WhatsAppMessage update
   */
  export type WhatsAppMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * The data needed to update a WhatsAppMessage.
     */
    data: XOR<WhatsAppMessageUpdateInput, WhatsAppMessageUncheckedUpdateInput>
    /**
     * Choose, which WhatsAppMessage to update.
     */
    where: WhatsAppMessageWhereUniqueInput
  }

  /**
   * WhatsAppMessage updateMany
   */
  export type WhatsAppMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update WhatsAppMessages.
     */
    data: XOR<WhatsAppMessageUpdateManyMutationInput, WhatsAppMessageUncheckedUpdateManyInput>
    /**
     * Filter which WhatsAppMessages to update
     */
    where?: WhatsAppMessageWhereInput
    /**
     * Limit how many WhatsAppMessages to update.
     */
    limit?: number
  }

  /**
   * WhatsAppMessage updateManyAndReturn
   */
  export type WhatsAppMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * The data used to update WhatsAppMessages.
     */
    data: XOR<WhatsAppMessageUpdateManyMutationInput, WhatsAppMessageUncheckedUpdateManyInput>
    /**
     * Filter which WhatsAppMessages to update
     */
    where?: WhatsAppMessageWhereInput
    /**
     * Limit how many WhatsAppMessages to update.
     */
    limit?: number
  }

  /**
   * WhatsAppMessage upsert
   */
  export type WhatsAppMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * The filter to search for the WhatsAppMessage to update in case it exists.
     */
    where: WhatsAppMessageWhereUniqueInput
    /**
     * In case the WhatsAppMessage found by the `where` argument doesn't exist, create a new WhatsAppMessage with this data.
     */
    create: XOR<WhatsAppMessageCreateInput, WhatsAppMessageUncheckedCreateInput>
    /**
     * In case the WhatsAppMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WhatsAppMessageUpdateInput, WhatsAppMessageUncheckedUpdateInput>
  }

  /**
   * WhatsAppMessage delete
   */
  export type WhatsAppMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
    /**
     * Filter which WhatsAppMessage to delete.
     */
    where: WhatsAppMessageWhereUniqueInput
  }

  /**
   * WhatsAppMessage deleteMany
   */
  export type WhatsAppMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which WhatsAppMessages to delete
     */
    where?: WhatsAppMessageWhereInput
    /**
     * Limit how many WhatsAppMessages to delete.
     */
    limit?: number
  }

  /**
   * WhatsAppMessage without action
   */
  export type WhatsAppMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the WhatsAppMessage
     */
    select?: WhatsAppMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the WhatsAppMessage
     */
    omit?: WhatsAppMessageOmit<ExtArgs> | null
  }


  /**
   * Model AnalyticsEvent
   */

  export type AggregateAnalyticsEvent = {
    _count: AnalyticsEventCountAggregateOutputType | null
    _min: AnalyticsEventMinAggregateOutputType | null
    _max: AnalyticsEventMaxAggregateOutputType | null
  }

  export type AnalyticsEventMinAggregateOutputType = {
    id: string | null
    type: string | null
    invoiceId: string | null
    secureToken: string | null
    sessionId: string | null
    createdAt: Date | null
  }

  export type AnalyticsEventMaxAggregateOutputType = {
    id: string | null
    type: string | null
    invoiceId: string | null
    secureToken: string | null
    sessionId: string | null
    createdAt: Date | null
  }

  export type AnalyticsEventCountAggregateOutputType = {
    id: number
    type: number
    invoiceId: number
    secureToken: number
    sessionId: number
    meta: number
    createdAt: number
    _all: number
  }


  export type AnalyticsEventMinAggregateInputType = {
    id?: true
    type?: true
    invoiceId?: true
    secureToken?: true
    sessionId?: true
    createdAt?: true
  }

  export type AnalyticsEventMaxAggregateInputType = {
    id?: true
    type?: true
    invoiceId?: true
    secureToken?: true
    sessionId?: true
    createdAt?: true
  }

  export type AnalyticsEventCountAggregateInputType = {
    id?: true
    type?: true
    invoiceId?: true
    secureToken?: true
    sessionId?: true
    meta?: true
    createdAt?: true
    _all?: true
  }

  export type AnalyticsEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AnalyticsEvent to aggregate.
     */
    where?: AnalyticsEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AnalyticsEvents to fetch.
     */
    orderBy?: AnalyticsEventOrderByWithRelationInput | AnalyticsEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AnalyticsEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AnalyticsEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AnalyticsEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AnalyticsEvents
    **/
    _count?: true | AnalyticsEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AnalyticsEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AnalyticsEventMaxAggregateInputType
  }

  export type GetAnalyticsEventAggregateType<T extends AnalyticsEventAggregateArgs> = {
        [P in keyof T & keyof AggregateAnalyticsEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAnalyticsEvent[P]>
      : GetScalarType<T[P], AggregateAnalyticsEvent[P]>
  }




  export type AnalyticsEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AnalyticsEventWhereInput
    orderBy?: AnalyticsEventOrderByWithAggregationInput | AnalyticsEventOrderByWithAggregationInput[]
    by: AnalyticsEventScalarFieldEnum[] | AnalyticsEventScalarFieldEnum
    having?: AnalyticsEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AnalyticsEventCountAggregateInputType | true
    _min?: AnalyticsEventMinAggregateInputType
    _max?: AnalyticsEventMaxAggregateInputType
  }

  export type AnalyticsEventGroupByOutputType = {
    id: string
    type: string
    invoiceId: string | null
    secureToken: string | null
    sessionId: string | null
    meta: JsonValue
    createdAt: Date
    _count: AnalyticsEventCountAggregateOutputType | null
    _min: AnalyticsEventMinAggregateOutputType | null
    _max: AnalyticsEventMaxAggregateOutputType | null
  }

  type GetAnalyticsEventGroupByPayload<T extends AnalyticsEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AnalyticsEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AnalyticsEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AnalyticsEventGroupByOutputType[P]>
            : GetScalarType<T[P], AnalyticsEventGroupByOutputType[P]>
        }
      >
    >


  export type AnalyticsEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    invoiceId?: boolean
    secureToken?: boolean
    sessionId?: boolean
    meta?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["analyticsEvent"]>

  export type AnalyticsEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    invoiceId?: boolean
    secureToken?: boolean
    sessionId?: boolean
    meta?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["analyticsEvent"]>

  export type AnalyticsEventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    type?: boolean
    invoiceId?: boolean
    secureToken?: boolean
    sessionId?: boolean
    meta?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["analyticsEvent"]>

  export type AnalyticsEventSelectScalar = {
    id?: boolean
    type?: boolean
    invoiceId?: boolean
    secureToken?: boolean
    sessionId?: boolean
    meta?: boolean
    createdAt?: boolean
  }

  export type AnalyticsEventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "type" | "invoiceId" | "secureToken" | "sessionId" | "meta" | "createdAt", ExtArgs["result"]["analyticsEvent"]>

  export type $AnalyticsEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AnalyticsEvent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      type: string
      invoiceId: string | null
      secureToken: string | null
      sessionId: string | null
      meta: Prisma.JsonValue
      createdAt: Date
    }, ExtArgs["result"]["analyticsEvent"]>
    composites: {}
  }

  type AnalyticsEventGetPayload<S extends boolean | null | undefined | AnalyticsEventDefaultArgs> = $Result.GetResult<Prisma.$AnalyticsEventPayload, S>

  type AnalyticsEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AnalyticsEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AnalyticsEventCountAggregateInputType | true
    }

  export interface AnalyticsEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AnalyticsEvent'], meta: { name: 'AnalyticsEvent' } }
    /**
     * Find zero or one AnalyticsEvent that matches the filter.
     * @param {AnalyticsEventFindUniqueArgs} args - Arguments to find a AnalyticsEvent
     * @example
     * // Get one AnalyticsEvent
     * const analyticsEvent = await prisma.analyticsEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AnalyticsEventFindUniqueArgs>(args: SelectSubset<T, AnalyticsEventFindUniqueArgs<ExtArgs>>): Prisma__AnalyticsEventClient<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AnalyticsEvent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AnalyticsEventFindUniqueOrThrowArgs} args - Arguments to find a AnalyticsEvent
     * @example
     * // Get one AnalyticsEvent
     * const analyticsEvent = await prisma.analyticsEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AnalyticsEventFindUniqueOrThrowArgs>(args: SelectSubset<T, AnalyticsEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AnalyticsEventClient<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AnalyticsEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalyticsEventFindFirstArgs} args - Arguments to find a AnalyticsEvent
     * @example
     * // Get one AnalyticsEvent
     * const analyticsEvent = await prisma.analyticsEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AnalyticsEventFindFirstArgs>(args?: SelectSubset<T, AnalyticsEventFindFirstArgs<ExtArgs>>): Prisma__AnalyticsEventClient<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AnalyticsEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalyticsEventFindFirstOrThrowArgs} args - Arguments to find a AnalyticsEvent
     * @example
     * // Get one AnalyticsEvent
     * const analyticsEvent = await prisma.analyticsEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AnalyticsEventFindFirstOrThrowArgs>(args?: SelectSubset<T, AnalyticsEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__AnalyticsEventClient<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AnalyticsEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalyticsEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AnalyticsEvents
     * const analyticsEvents = await prisma.analyticsEvent.findMany()
     * 
     * // Get first 10 AnalyticsEvents
     * const analyticsEvents = await prisma.analyticsEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const analyticsEventWithIdOnly = await prisma.analyticsEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AnalyticsEventFindManyArgs>(args?: SelectSubset<T, AnalyticsEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AnalyticsEvent.
     * @param {AnalyticsEventCreateArgs} args - Arguments to create a AnalyticsEvent.
     * @example
     * // Create one AnalyticsEvent
     * const AnalyticsEvent = await prisma.analyticsEvent.create({
     *   data: {
     *     // ... data to create a AnalyticsEvent
     *   }
     * })
     * 
     */
    create<T extends AnalyticsEventCreateArgs>(args: SelectSubset<T, AnalyticsEventCreateArgs<ExtArgs>>): Prisma__AnalyticsEventClient<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AnalyticsEvents.
     * @param {AnalyticsEventCreateManyArgs} args - Arguments to create many AnalyticsEvents.
     * @example
     * // Create many AnalyticsEvents
     * const analyticsEvent = await prisma.analyticsEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AnalyticsEventCreateManyArgs>(args?: SelectSubset<T, AnalyticsEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AnalyticsEvents and returns the data saved in the database.
     * @param {AnalyticsEventCreateManyAndReturnArgs} args - Arguments to create many AnalyticsEvents.
     * @example
     * // Create many AnalyticsEvents
     * const analyticsEvent = await prisma.analyticsEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AnalyticsEvents and only return the `id`
     * const analyticsEventWithIdOnly = await prisma.analyticsEvent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AnalyticsEventCreateManyAndReturnArgs>(args?: SelectSubset<T, AnalyticsEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AnalyticsEvent.
     * @param {AnalyticsEventDeleteArgs} args - Arguments to delete one AnalyticsEvent.
     * @example
     * // Delete one AnalyticsEvent
     * const AnalyticsEvent = await prisma.analyticsEvent.delete({
     *   where: {
     *     // ... filter to delete one AnalyticsEvent
     *   }
     * })
     * 
     */
    delete<T extends AnalyticsEventDeleteArgs>(args: SelectSubset<T, AnalyticsEventDeleteArgs<ExtArgs>>): Prisma__AnalyticsEventClient<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AnalyticsEvent.
     * @param {AnalyticsEventUpdateArgs} args - Arguments to update one AnalyticsEvent.
     * @example
     * // Update one AnalyticsEvent
     * const analyticsEvent = await prisma.analyticsEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AnalyticsEventUpdateArgs>(args: SelectSubset<T, AnalyticsEventUpdateArgs<ExtArgs>>): Prisma__AnalyticsEventClient<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AnalyticsEvents.
     * @param {AnalyticsEventDeleteManyArgs} args - Arguments to filter AnalyticsEvents to delete.
     * @example
     * // Delete a few AnalyticsEvents
     * const { count } = await prisma.analyticsEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AnalyticsEventDeleteManyArgs>(args?: SelectSubset<T, AnalyticsEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AnalyticsEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalyticsEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AnalyticsEvents
     * const analyticsEvent = await prisma.analyticsEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AnalyticsEventUpdateManyArgs>(args: SelectSubset<T, AnalyticsEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AnalyticsEvents and returns the data updated in the database.
     * @param {AnalyticsEventUpdateManyAndReturnArgs} args - Arguments to update many AnalyticsEvents.
     * @example
     * // Update many AnalyticsEvents
     * const analyticsEvent = await prisma.analyticsEvent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AnalyticsEvents and only return the `id`
     * const analyticsEventWithIdOnly = await prisma.analyticsEvent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AnalyticsEventUpdateManyAndReturnArgs>(args: SelectSubset<T, AnalyticsEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AnalyticsEvent.
     * @param {AnalyticsEventUpsertArgs} args - Arguments to update or create a AnalyticsEvent.
     * @example
     * // Update or create a AnalyticsEvent
     * const analyticsEvent = await prisma.analyticsEvent.upsert({
     *   create: {
     *     // ... data to create a AnalyticsEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AnalyticsEvent we want to update
     *   }
     * })
     */
    upsert<T extends AnalyticsEventUpsertArgs>(args: SelectSubset<T, AnalyticsEventUpsertArgs<ExtArgs>>): Prisma__AnalyticsEventClient<$Result.GetResult<Prisma.$AnalyticsEventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AnalyticsEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalyticsEventCountArgs} args - Arguments to filter AnalyticsEvents to count.
     * @example
     * // Count the number of AnalyticsEvents
     * const count = await prisma.analyticsEvent.count({
     *   where: {
     *     // ... the filter for the AnalyticsEvents we want to count
     *   }
     * })
    **/
    count<T extends AnalyticsEventCountArgs>(
      args?: Subset<T, AnalyticsEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AnalyticsEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AnalyticsEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalyticsEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AnalyticsEventAggregateArgs>(args: Subset<T, AnalyticsEventAggregateArgs>): Prisma.PrismaPromise<GetAnalyticsEventAggregateType<T>>

    /**
     * Group by AnalyticsEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AnalyticsEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AnalyticsEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AnalyticsEventGroupByArgs['orderBy'] }
        : { orderBy?: AnalyticsEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AnalyticsEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAnalyticsEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AnalyticsEvent model
   */
  readonly fields: AnalyticsEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AnalyticsEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AnalyticsEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AnalyticsEvent model
   */
  interface AnalyticsEventFieldRefs {
    readonly id: FieldRef<"AnalyticsEvent", 'String'>
    readonly type: FieldRef<"AnalyticsEvent", 'String'>
    readonly invoiceId: FieldRef<"AnalyticsEvent", 'String'>
    readonly secureToken: FieldRef<"AnalyticsEvent", 'String'>
    readonly sessionId: FieldRef<"AnalyticsEvent", 'String'>
    readonly meta: FieldRef<"AnalyticsEvent", 'Json'>
    readonly createdAt: FieldRef<"AnalyticsEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AnalyticsEvent findUnique
   */
  export type AnalyticsEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * Filter, which AnalyticsEvent to fetch.
     */
    where: AnalyticsEventWhereUniqueInput
  }

  /**
   * AnalyticsEvent findUniqueOrThrow
   */
  export type AnalyticsEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * Filter, which AnalyticsEvent to fetch.
     */
    where: AnalyticsEventWhereUniqueInput
  }

  /**
   * AnalyticsEvent findFirst
   */
  export type AnalyticsEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * Filter, which AnalyticsEvent to fetch.
     */
    where?: AnalyticsEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AnalyticsEvents to fetch.
     */
    orderBy?: AnalyticsEventOrderByWithRelationInput | AnalyticsEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AnalyticsEvents.
     */
    cursor?: AnalyticsEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AnalyticsEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AnalyticsEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AnalyticsEvents.
     */
    distinct?: AnalyticsEventScalarFieldEnum | AnalyticsEventScalarFieldEnum[]
  }

  /**
   * AnalyticsEvent findFirstOrThrow
   */
  export type AnalyticsEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * Filter, which AnalyticsEvent to fetch.
     */
    where?: AnalyticsEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AnalyticsEvents to fetch.
     */
    orderBy?: AnalyticsEventOrderByWithRelationInput | AnalyticsEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AnalyticsEvents.
     */
    cursor?: AnalyticsEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AnalyticsEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AnalyticsEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AnalyticsEvents.
     */
    distinct?: AnalyticsEventScalarFieldEnum | AnalyticsEventScalarFieldEnum[]
  }

  /**
   * AnalyticsEvent findMany
   */
  export type AnalyticsEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * Filter, which AnalyticsEvents to fetch.
     */
    where?: AnalyticsEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AnalyticsEvents to fetch.
     */
    orderBy?: AnalyticsEventOrderByWithRelationInput | AnalyticsEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AnalyticsEvents.
     */
    cursor?: AnalyticsEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AnalyticsEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AnalyticsEvents.
     */
    skip?: number
    distinct?: AnalyticsEventScalarFieldEnum | AnalyticsEventScalarFieldEnum[]
  }

  /**
   * AnalyticsEvent create
   */
  export type AnalyticsEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * The data needed to create a AnalyticsEvent.
     */
    data: XOR<AnalyticsEventCreateInput, AnalyticsEventUncheckedCreateInput>
  }

  /**
   * AnalyticsEvent createMany
   */
  export type AnalyticsEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AnalyticsEvents.
     */
    data: AnalyticsEventCreateManyInput | AnalyticsEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AnalyticsEvent createManyAndReturn
   */
  export type AnalyticsEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * The data used to create many AnalyticsEvents.
     */
    data: AnalyticsEventCreateManyInput | AnalyticsEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AnalyticsEvent update
   */
  export type AnalyticsEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * The data needed to update a AnalyticsEvent.
     */
    data: XOR<AnalyticsEventUpdateInput, AnalyticsEventUncheckedUpdateInput>
    /**
     * Choose, which AnalyticsEvent to update.
     */
    where: AnalyticsEventWhereUniqueInput
  }

  /**
   * AnalyticsEvent updateMany
   */
  export type AnalyticsEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AnalyticsEvents.
     */
    data: XOR<AnalyticsEventUpdateManyMutationInput, AnalyticsEventUncheckedUpdateManyInput>
    /**
     * Filter which AnalyticsEvents to update
     */
    where?: AnalyticsEventWhereInput
    /**
     * Limit how many AnalyticsEvents to update.
     */
    limit?: number
  }

  /**
   * AnalyticsEvent updateManyAndReturn
   */
  export type AnalyticsEventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * The data used to update AnalyticsEvents.
     */
    data: XOR<AnalyticsEventUpdateManyMutationInput, AnalyticsEventUncheckedUpdateManyInput>
    /**
     * Filter which AnalyticsEvents to update
     */
    where?: AnalyticsEventWhereInput
    /**
     * Limit how many AnalyticsEvents to update.
     */
    limit?: number
  }

  /**
   * AnalyticsEvent upsert
   */
  export type AnalyticsEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * The filter to search for the AnalyticsEvent to update in case it exists.
     */
    where: AnalyticsEventWhereUniqueInput
    /**
     * In case the AnalyticsEvent found by the `where` argument doesn't exist, create a new AnalyticsEvent with this data.
     */
    create: XOR<AnalyticsEventCreateInput, AnalyticsEventUncheckedCreateInput>
    /**
     * In case the AnalyticsEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AnalyticsEventUpdateInput, AnalyticsEventUncheckedUpdateInput>
  }

  /**
   * AnalyticsEvent delete
   */
  export type AnalyticsEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
    /**
     * Filter which AnalyticsEvent to delete.
     */
    where: AnalyticsEventWhereUniqueInput
  }

  /**
   * AnalyticsEvent deleteMany
   */
  export type AnalyticsEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AnalyticsEvents to delete
     */
    where?: AnalyticsEventWhereInput
    /**
     * Limit how many AnalyticsEvents to delete.
     */
    limit?: number
  }

  /**
   * AnalyticsEvent without action
   */
  export type AnalyticsEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AnalyticsEvent
     */
    select?: AnalyticsEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AnalyticsEvent
     */
    omit?: AnalyticsEventOmit<ExtArgs> | null
  }


  /**
   * Model BackupLog
   */

  export type AggregateBackupLog = {
    _count: BackupLogCountAggregateOutputType | null
    _avg: BackupLogAvgAggregateOutputType | null
    _sum: BackupLogSumAggregateOutputType | null
    _min: BackupLogMinAggregateOutputType | null
    _max: BackupLogMaxAggregateOutputType | null
  }

  export type BackupLogAvgAggregateOutputType = {
    sizeBytes: number | null
    durationMs: number | null
  }

  export type BackupLogSumAggregateOutputType = {
    sizeBytes: number | null
    durationMs: number | null
  }

  export type BackupLogMinAggregateOutputType = {
    id: string | null
    kind: string | null
    target: string | null
    status: string | null
    fileName: string | null
    sizeBytes: number | null
    durationMs: number | null
    error: string | null
    createdAt: Date | null
  }

  export type BackupLogMaxAggregateOutputType = {
    id: string | null
    kind: string | null
    target: string | null
    status: string | null
    fileName: string | null
    sizeBytes: number | null
    durationMs: number | null
    error: string | null
    createdAt: Date | null
  }

  export type BackupLogCountAggregateOutputType = {
    id: number
    kind: number
    target: number
    status: number
    fileName: number
    sizeBytes: number
    durationMs: number
    error: number
    createdAt: number
    _all: number
  }


  export type BackupLogAvgAggregateInputType = {
    sizeBytes?: true
    durationMs?: true
  }

  export type BackupLogSumAggregateInputType = {
    sizeBytes?: true
    durationMs?: true
  }

  export type BackupLogMinAggregateInputType = {
    id?: true
    kind?: true
    target?: true
    status?: true
    fileName?: true
    sizeBytes?: true
    durationMs?: true
    error?: true
    createdAt?: true
  }

  export type BackupLogMaxAggregateInputType = {
    id?: true
    kind?: true
    target?: true
    status?: true
    fileName?: true
    sizeBytes?: true
    durationMs?: true
    error?: true
    createdAt?: true
  }

  export type BackupLogCountAggregateInputType = {
    id?: true
    kind?: true
    target?: true
    status?: true
    fileName?: true
    sizeBytes?: true
    durationMs?: true
    error?: true
    createdAt?: true
    _all?: true
  }

  export type BackupLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BackupLog to aggregate.
     */
    where?: BackupLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackupLogs to fetch.
     */
    orderBy?: BackupLogOrderByWithRelationInput | BackupLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BackupLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackupLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackupLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned BackupLogs
    **/
    _count?: true | BackupLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: BackupLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: BackupLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BackupLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BackupLogMaxAggregateInputType
  }

  export type GetBackupLogAggregateType<T extends BackupLogAggregateArgs> = {
        [P in keyof T & keyof AggregateBackupLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBackupLog[P]>
      : GetScalarType<T[P], AggregateBackupLog[P]>
  }




  export type BackupLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BackupLogWhereInput
    orderBy?: BackupLogOrderByWithAggregationInput | BackupLogOrderByWithAggregationInput[]
    by: BackupLogScalarFieldEnum[] | BackupLogScalarFieldEnum
    having?: BackupLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BackupLogCountAggregateInputType | true
    _avg?: BackupLogAvgAggregateInputType
    _sum?: BackupLogSumAggregateInputType
    _min?: BackupLogMinAggregateInputType
    _max?: BackupLogMaxAggregateInputType
  }

  export type BackupLogGroupByOutputType = {
    id: string
    kind: string
    target: string
    status: string
    fileName: string | null
    sizeBytes: number | null
    durationMs: number | null
    error: string | null
    createdAt: Date
    _count: BackupLogCountAggregateOutputType | null
    _avg: BackupLogAvgAggregateOutputType | null
    _sum: BackupLogSumAggregateOutputType | null
    _min: BackupLogMinAggregateOutputType | null
    _max: BackupLogMaxAggregateOutputType | null
  }

  type GetBackupLogGroupByPayload<T extends BackupLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BackupLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BackupLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BackupLogGroupByOutputType[P]>
            : GetScalarType<T[P], BackupLogGroupByOutputType[P]>
        }
      >
    >


  export type BackupLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    kind?: boolean
    target?: boolean
    status?: boolean
    fileName?: boolean
    sizeBytes?: boolean
    durationMs?: boolean
    error?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["backupLog"]>

  export type BackupLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    kind?: boolean
    target?: boolean
    status?: boolean
    fileName?: boolean
    sizeBytes?: boolean
    durationMs?: boolean
    error?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["backupLog"]>

  export type BackupLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    kind?: boolean
    target?: boolean
    status?: boolean
    fileName?: boolean
    sizeBytes?: boolean
    durationMs?: boolean
    error?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["backupLog"]>

  export type BackupLogSelectScalar = {
    id?: boolean
    kind?: boolean
    target?: boolean
    status?: boolean
    fileName?: boolean
    sizeBytes?: boolean
    durationMs?: boolean
    error?: boolean
    createdAt?: boolean
  }

  export type BackupLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "kind" | "target" | "status" | "fileName" | "sizeBytes" | "durationMs" | "error" | "createdAt", ExtArgs["result"]["backupLog"]>

  export type $BackupLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "BackupLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      kind: string
      target: string
      status: string
      fileName: string | null
      sizeBytes: number | null
      durationMs: number | null
      error: string | null
      createdAt: Date
    }, ExtArgs["result"]["backupLog"]>
    composites: {}
  }

  type BackupLogGetPayload<S extends boolean | null | undefined | BackupLogDefaultArgs> = $Result.GetResult<Prisma.$BackupLogPayload, S>

  type BackupLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<BackupLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: BackupLogCountAggregateInputType | true
    }

  export interface BackupLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['BackupLog'], meta: { name: 'BackupLog' } }
    /**
     * Find zero or one BackupLog that matches the filter.
     * @param {BackupLogFindUniqueArgs} args - Arguments to find a BackupLog
     * @example
     * // Get one BackupLog
     * const backupLog = await prisma.backupLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BackupLogFindUniqueArgs>(args: SelectSubset<T, BackupLogFindUniqueArgs<ExtArgs>>): Prisma__BackupLogClient<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one BackupLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {BackupLogFindUniqueOrThrowArgs} args - Arguments to find a BackupLog
     * @example
     * // Get one BackupLog
     * const backupLog = await prisma.backupLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BackupLogFindUniqueOrThrowArgs>(args: SelectSubset<T, BackupLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BackupLogClient<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BackupLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupLogFindFirstArgs} args - Arguments to find a BackupLog
     * @example
     * // Get one BackupLog
     * const backupLog = await prisma.backupLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BackupLogFindFirstArgs>(args?: SelectSubset<T, BackupLogFindFirstArgs<ExtArgs>>): Prisma__BackupLogClient<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first BackupLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupLogFindFirstOrThrowArgs} args - Arguments to find a BackupLog
     * @example
     * // Get one BackupLog
     * const backupLog = await prisma.backupLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BackupLogFindFirstOrThrowArgs>(args?: SelectSubset<T, BackupLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__BackupLogClient<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more BackupLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all BackupLogs
     * const backupLogs = await prisma.backupLog.findMany()
     * 
     * // Get first 10 BackupLogs
     * const backupLogs = await prisma.backupLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const backupLogWithIdOnly = await prisma.backupLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BackupLogFindManyArgs>(args?: SelectSubset<T, BackupLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a BackupLog.
     * @param {BackupLogCreateArgs} args - Arguments to create a BackupLog.
     * @example
     * // Create one BackupLog
     * const BackupLog = await prisma.backupLog.create({
     *   data: {
     *     // ... data to create a BackupLog
     *   }
     * })
     * 
     */
    create<T extends BackupLogCreateArgs>(args: SelectSubset<T, BackupLogCreateArgs<ExtArgs>>): Prisma__BackupLogClient<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many BackupLogs.
     * @param {BackupLogCreateManyArgs} args - Arguments to create many BackupLogs.
     * @example
     * // Create many BackupLogs
     * const backupLog = await prisma.backupLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BackupLogCreateManyArgs>(args?: SelectSubset<T, BackupLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many BackupLogs and returns the data saved in the database.
     * @param {BackupLogCreateManyAndReturnArgs} args - Arguments to create many BackupLogs.
     * @example
     * // Create many BackupLogs
     * const backupLog = await prisma.backupLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many BackupLogs and only return the `id`
     * const backupLogWithIdOnly = await prisma.backupLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends BackupLogCreateManyAndReturnArgs>(args?: SelectSubset<T, BackupLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a BackupLog.
     * @param {BackupLogDeleteArgs} args - Arguments to delete one BackupLog.
     * @example
     * // Delete one BackupLog
     * const BackupLog = await prisma.backupLog.delete({
     *   where: {
     *     // ... filter to delete one BackupLog
     *   }
     * })
     * 
     */
    delete<T extends BackupLogDeleteArgs>(args: SelectSubset<T, BackupLogDeleteArgs<ExtArgs>>): Prisma__BackupLogClient<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one BackupLog.
     * @param {BackupLogUpdateArgs} args - Arguments to update one BackupLog.
     * @example
     * // Update one BackupLog
     * const backupLog = await prisma.backupLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BackupLogUpdateArgs>(args: SelectSubset<T, BackupLogUpdateArgs<ExtArgs>>): Prisma__BackupLogClient<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more BackupLogs.
     * @param {BackupLogDeleteManyArgs} args - Arguments to filter BackupLogs to delete.
     * @example
     * // Delete a few BackupLogs
     * const { count } = await prisma.backupLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BackupLogDeleteManyArgs>(args?: SelectSubset<T, BackupLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BackupLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many BackupLogs
     * const backupLog = await prisma.backupLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BackupLogUpdateManyArgs>(args: SelectSubset<T, BackupLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more BackupLogs and returns the data updated in the database.
     * @param {BackupLogUpdateManyAndReturnArgs} args - Arguments to update many BackupLogs.
     * @example
     * // Update many BackupLogs
     * const backupLog = await prisma.backupLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more BackupLogs and only return the `id`
     * const backupLogWithIdOnly = await prisma.backupLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends BackupLogUpdateManyAndReturnArgs>(args: SelectSubset<T, BackupLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one BackupLog.
     * @param {BackupLogUpsertArgs} args - Arguments to update or create a BackupLog.
     * @example
     * // Update or create a BackupLog
     * const backupLog = await prisma.backupLog.upsert({
     *   create: {
     *     // ... data to create a BackupLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the BackupLog we want to update
     *   }
     * })
     */
    upsert<T extends BackupLogUpsertArgs>(args: SelectSubset<T, BackupLogUpsertArgs<ExtArgs>>): Prisma__BackupLogClient<$Result.GetResult<Prisma.$BackupLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of BackupLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupLogCountArgs} args - Arguments to filter BackupLogs to count.
     * @example
     * // Count the number of BackupLogs
     * const count = await prisma.backupLog.count({
     *   where: {
     *     // ... the filter for the BackupLogs we want to count
     *   }
     * })
    **/
    count<T extends BackupLogCountArgs>(
      args?: Subset<T, BackupLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BackupLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a BackupLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BackupLogAggregateArgs>(args: Subset<T, BackupLogAggregateArgs>): Prisma.PrismaPromise<GetBackupLogAggregateType<T>>

    /**
     * Group by BackupLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BackupLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BackupLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BackupLogGroupByArgs['orderBy'] }
        : { orderBy?: BackupLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BackupLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBackupLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the BackupLog model
   */
  readonly fields: BackupLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for BackupLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BackupLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the BackupLog model
   */
  interface BackupLogFieldRefs {
    readonly id: FieldRef<"BackupLog", 'String'>
    readonly kind: FieldRef<"BackupLog", 'String'>
    readonly target: FieldRef<"BackupLog", 'String'>
    readonly status: FieldRef<"BackupLog", 'String'>
    readonly fileName: FieldRef<"BackupLog", 'String'>
    readonly sizeBytes: FieldRef<"BackupLog", 'Int'>
    readonly durationMs: FieldRef<"BackupLog", 'Int'>
    readonly error: FieldRef<"BackupLog", 'String'>
    readonly createdAt: FieldRef<"BackupLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * BackupLog findUnique
   */
  export type BackupLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * Filter, which BackupLog to fetch.
     */
    where: BackupLogWhereUniqueInput
  }

  /**
   * BackupLog findUniqueOrThrow
   */
  export type BackupLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * Filter, which BackupLog to fetch.
     */
    where: BackupLogWhereUniqueInput
  }

  /**
   * BackupLog findFirst
   */
  export type BackupLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * Filter, which BackupLog to fetch.
     */
    where?: BackupLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackupLogs to fetch.
     */
    orderBy?: BackupLogOrderByWithRelationInput | BackupLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BackupLogs.
     */
    cursor?: BackupLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackupLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackupLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BackupLogs.
     */
    distinct?: BackupLogScalarFieldEnum | BackupLogScalarFieldEnum[]
  }

  /**
   * BackupLog findFirstOrThrow
   */
  export type BackupLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * Filter, which BackupLog to fetch.
     */
    where?: BackupLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackupLogs to fetch.
     */
    orderBy?: BackupLogOrderByWithRelationInput | BackupLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for BackupLogs.
     */
    cursor?: BackupLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackupLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackupLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of BackupLogs.
     */
    distinct?: BackupLogScalarFieldEnum | BackupLogScalarFieldEnum[]
  }

  /**
   * BackupLog findMany
   */
  export type BackupLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * Filter, which BackupLogs to fetch.
     */
    where?: BackupLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of BackupLogs to fetch.
     */
    orderBy?: BackupLogOrderByWithRelationInput | BackupLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing BackupLogs.
     */
    cursor?: BackupLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` BackupLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` BackupLogs.
     */
    skip?: number
    distinct?: BackupLogScalarFieldEnum | BackupLogScalarFieldEnum[]
  }

  /**
   * BackupLog create
   */
  export type BackupLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * The data needed to create a BackupLog.
     */
    data?: XOR<BackupLogCreateInput, BackupLogUncheckedCreateInput>
  }

  /**
   * BackupLog createMany
   */
  export type BackupLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many BackupLogs.
     */
    data: BackupLogCreateManyInput | BackupLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BackupLog createManyAndReturn
   */
  export type BackupLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * The data used to create many BackupLogs.
     */
    data: BackupLogCreateManyInput | BackupLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * BackupLog update
   */
  export type BackupLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * The data needed to update a BackupLog.
     */
    data: XOR<BackupLogUpdateInput, BackupLogUncheckedUpdateInput>
    /**
     * Choose, which BackupLog to update.
     */
    where: BackupLogWhereUniqueInput
  }

  /**
   * BackupLog updateMany
   */
  export type BackupLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update BackupLogs.
     */
    data: XOR<BackupLogUpdateManyMutationInput, BackupLogUncheckedUpdateManyInput>
    /**
     * Filter which BackupLogs to update
     */
    where?: BackupLogWhereInput
    /**
     * Limit how many BackupLogs to update.
     */
    limit?: number
  }

  /**
   * BackupLog updateManyAndReturn
   */
  export type BackupLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * The data used to update BackupLogs.
     */
    data: XOR<BackupLogUpdateManyMutationInput, BackupLogUncheckedUpdateManyInput>
    /**
     * Filter which BackupLogs to update
     */
    where?: BackupLogWhereInput
    /**
     * Limit how many BackupLogs to update.
     */
    limit?: number
  }

  /**
   * BackupLog upsert
   */
  export type BackupLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * The filter to search for the BackupLog to update in case it exists.
     */
    where: BackupLogWhereUniqueInput
    /**
     * In case the BackupLog found by the `where` argument doesn't exist, create a new BackupLog with this data.
     */
    create: XOR<BackupLogCreateInput, BackupLogUncheckedCreateInput>
    /**
     * In case the BackupLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BackupLogUpdateInput, BackupLogUncheckedUpdateInput>
  }

  /**
   * BackupLog delete
   */
  export type BackupLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
    /**
     * Filter which BackupLog to delete.
     */
    where: BackupLogWhereUniqueInput
  }

  /**
   * BackupLog deleteMany
   */
  export type BackupLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which BackupLogs to delete
     */
    where?: BackupLogWhereInput
    /**
     * Limit how many BackupLogs to delete.
     */
    limit?: number
  }

  /**
   * BackupLog without action
   */
  export type BackupLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BackupLog
     */
    select?: BackupLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the BackupLog
     */
    omit?: BackupLogOmit<ExtArgs> | null
  }


  /**
   * Model Customer
   */

  export type AggregateCustomer = {
    _count: CustomerCountAggregateOutputType | null
    _avg: CustomerAvgAggregateOutputType | null
    _sum: CustomerSumAggregateOutputType | null
    _min: CustomerMinAggregateOutputType | null
    _max: CustomerMaxAggregateOutputType | null
  }

  export type CustomerAvgAggregateOutputType = {
    leadScore: number | null
  }

  export type CustomerSumAggregateOutputType = {
    leadScore: number | null
  }

  export type CustomerMinAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    phone: string | null
    whatsapp: string | null
    company: string | null
    role: string | null
    status: string | null
    notes: string | null
    source: string | null
    leadScore: number | null
    createdAt: Date | null
    updatedAt: Date | null
    lastContactAt: Date | null
  }

  export type CustomerMaxAggregateOutputType = {
    id: string | null
    name: string | null
    email: string | null
    phone: string | null
    whatsapp: string | null
    company: string | null
    role: string | null
    status: string | null
    notes: string | null
    source: string | null
    leadScore: number | null
    createdAt: Date | null
    updatedAt: Date | null
    lastContactAt: Date | null
  }

  export type CustomerCountAggregateOutputType = {
    id: number
    name: number
    email: number
    phone: number
    whatsapp: number
    company: number
    role: number
    status: number
    tags: number
    notes: number
    source: number
    leadScore: number
    createdAt: number
    updatedAt: number
    lastContactAt: number
    _all: number
  }


  export type CustomerAvgAggregateInputType = {
    leadScore?: true
  }

  export type CustomerSumAggregateInputType = {
    leadScore?: true
  }

  export type CustomerMinAggregateInputType = {
    id?: true
    name?: true
    email?: true
    phone?: true
    whatsapp?: true
    company?: true
    role?: true
    status?: true
    notes?: true
    source?: true
    leadScore?: true
    createdAt?: true
    updatedAt?: true
    lastContactAt?: true
  }

  export type CustomerMaxAggregateInputType = {
    id?: true
    name?: true
    email?: true
    phone?: true
    whatsapp?: true
    company?: true
    role?: true
    status?: true
    notes?: true
    source?: true
    leadScore?: true
    createdAt?: true
    updatedAt?: true
    lastContactAt?: true
  }

  export type CustomerCountAggregateInputType = {
    id?: true
    name?: true
    email?: true
    phone?: true
    whatsapp?: true
    company?: true
    role?: true
    status?: true
    tags?: true
    notes?: true
    source?: true
    leadScore?: true
    createdAt?: true
    updatedAt?: true
    lastContactAt?: true
    _all?: true
  }

  export type CustomerAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Customer to aggregate.
     */
    where?: CustomerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Customers to fetch.
     */
    orderBy?: CustomerOrderByWithRelationInput | CustomerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CustomerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Customers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Customers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Customers
    **/
    _count?: true | CustomerCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CustomerAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CustomerSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CustomerMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CustomerMaxAggregateInputType
  }

  export type GetCustomerAggregateType<T extends CustomerAggregateArgs> = {
        [P in keyof T & keyof AggregateCustomer]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCustomer[P]>
      : GetScalarType<T[P], AggregateCustomer[P]>
  }




  export type CustomerGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CustomerWhereInput
    orderBy?: CustomerOrderByWithAggregationInput | CustomerOrderByWithAggregationInput[]
    by: CustomerScalarFieldEnum[] | CustomerScalarFieldEnum
    having?: CustomerScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CustomerCountAggregateInputType | true
    _avg?: CustomerAvgAggregateInputType
    _sum?: CustomerSumAggregateInputType
    _min?: CustomerMinAggregateInputType
    _max?: CustomerMaxAggregateInputType
  }

  export type CustomerGroupByOutputType = {
    id: string
    name: string
    email: string
    phone: string | null
    whatsapp: string | null
    company: string | null
    role: string | null
    status: string
    tags: JsonValue
    notes: string | null
    source: string
    leadScore: number | null
    createdAt: Date
    updatedAt: Date
    lastContactAt: Date | null
    _count: CustomerCountAggregateOutputType | null
    _avg: CustomerAvgAggregateOutputType | null
    _sum: CustomerSumAggregateOutputType | null
    _min: CustomerMinAggregateOutputType | null
    _max: CustomerMaxAggregateOutputType | null
  }

  type GetCustomerGroupByPayload<T extends CustomerGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CustomerGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CustomerGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CustomerGroupByOutputType[P]>
            : GetScalarType<T[P], CustomerGroupByOutputType[P]>
        }
      >
    >


  export type CustomerSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    whatsapp?: boolean
    company?: boolean
    role?: boolean
    status?: boolean
    tags?: boolean
    notes?: boolean
    source?: boolean
    leadScore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastContactAt?: boolean
  }, ExtArgs["result"]["customer"]>

  export type CustomerSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    whatsapp?: boolean
    company?: boolean
    role?: boolean
    status?: boolean
    tags?: boolean
    notes?: boolean
    source?: boolean
    leadScore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastContactAt?: boolean
  }, ExtArgs["result"]["customer"]>

  export type CustomerSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    whatsapp?: boolean
    company?: boolean
    role?: boolean
    status?: boolean
    tags?: boolean
    notes?: boolean
    source?: boolean
    leadScore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastContactAt?: boolean
  }, ExtArgs["result"]["customer"]>

  export type CustomerSelectScalar = {
    id?: boolean
    name?: boolean
    email?: boolean
    phone?: boolean
    whatsapp?: boolean
    company?: boolean
    role?: boolean
    status?: boolean
    tags?: boolean
    notes?: boolean
    source?: boolean
    leadScore?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastContactAt?: boolean
  }

  export type CustomerOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "name" | "email" | "phone" | "whatsapp" | "company" | "role" | "status" | "tags" | "notes" | "source" | "leadScore" | "createdAt" | "updatedAt" | "lastContactAt", ExtArgs["result"]["customer"]>

  export type $CustomerPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Customer"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      email: string
      phone: string | null
      whatsapp: string | null
      company: string | null
      role: string | null
      status: string
      tags: Prisma.JsonValue
      notes: string | null
      source: string
      leadScore: number | null
      createdAt: Date
      updatedAt: Date
      lastContactAt: Date | null
    }, ExtArgs["result"]["customer"]>
    composites: {}
  }

  type CustomerGetPayload<S extends boolean | null | undefined | CustomerDefaultArgs> = $Result.GetResult<Prisma.$CustomerPayload, S>

  type CustomerCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CustomerFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CustomerCountAggregateInputType | true
    }

  export interface CustomerDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Customer'], meta: { name: 'Customer' } }
    /**
     * Find zero or one Customer that matches the filter.
     * @param {CustomerFindUniqueArgs} args - Arguments to find a Customer
     * @example
     * // Get one Customer
     * const customer = await prisma.customer.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CustomerFindUniqueArgs>(args: SelectSubset<T, CustomerFindUniqueArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Customer that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CustomerFindUniqueOrThrowArgs} args - Arguments to find a Customer
     * @example
     * // Get one Customer
     * const customer = await prisma.customer.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CustomerFindUniqueOrThrowArgs>(args: SelectSubset<T, CustomerFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Customer that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerFindFirstArgs} args - Arguments to find a Customer
     * @example
     * // Get one Customer
     * const customer = await prisma.customer.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CustomerFindFirstArgs>(args?: SelectSubset<T, CustomerFindFirstArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Customer that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerFindFirstOrThrowArgs} args - Arguments to find a Customer
     * @example
     * // Get one Customer
     * const customer = await prisma.customer.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CustomerFindFirstOrThrowArgs>(args?: SelectSubset<T, CustomerFindFirstOrThrowArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Customers that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Customers
     * const customers = await prisma.customer.findMany()
     * 
     * // Get first 10 Customers
     * const customers = await prisma.customer.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const customerWithIdOnly = await prisma.customer.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CustomerFindManyArgs>(args?: SelectSubset<T, CustomerFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Customer.
     * @param {CustomerCreateArgs} args - Arguments to create a Customer.
     * @example
     * // Create one Customer
     * const Customer = await prisma.customer.create({
     *   data: {
     *     // ... data to create a Customer
     *   }
     * })
     * 
     */
    create<T extends CustomerCreateArgs>(args: SelectSubset<T, CustomerCreateArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Customers.
     * @param {CustomerCreateManyArgs} args - Arguments to create many Customers.
     * @example
     * // Create many Customers
     * const customer = await prisma.customer.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CustomerCreateManyArgs>(args?: SelectSubset<T, CustomerCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Customers and returns the data saved in the database.
     * @param {CustomerCreateManyAndReturnArgs} args - Arguments to create many Customers.
     * @example
     * // Create many Customers
     * const customer = await prisma.customer.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Customers and only return the `id`
     * const customerWithIdOnly = await prisma.customer.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CustomerCreateManyAndReturnArgs>(args?: SelectSubset<T, CustomerCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Customer.
     * @param {CustomerDeleteArgs} args - Arguments to delete one Customer.
     * @example
     * // Delete one Customer
     * const Customer = await prisma.customer.delete({
     *   where: {
     *     // ... filter to delete one Customer
     *   }
     * })
     * 
     */
    delete<T extends CustomerDeleteArgs>(args: SelectSubset<T, CustomerDeleteArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Customer.
     * @param {CustomerUpdateArgs} args - Arguments to update one Customer.
     * @example
     * // Update one Customer
     * const customer = await prisma.customer.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CustomerUpdateArgs>(args: SelectSubset<T, CustomerUpdateArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Customers.
     * @param {CustomerDeleteManyArgs} args - Arguments to filter Customers to delete.
     * @example
     * // Delete a few Customers
     * const { count } = await prisma.customer.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CustomerDeleteManyArgs>(args?: SelectSubset<T, CustomerDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Customers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Customers
     * const customer = await prisma.customer.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CustomerUpdateManyArgs>(args: SelectSubset<T, CustomerUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Customers and returns the data updated in the database.
     * @param {CustomerUpdateManyAndReturnArgs} args - Arguments to update many Customers.
     * @example
     * // Update many Customers
     * const customer = await prisma.customer.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Customers and only return the `id`
     * const customerWithIdOnly = await prisma.customer.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CustomerUpdateManyAndReturnArgs>(args: SelectSubset<T, CustomerUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Customer.
     * @param {CustomerUpsertArgs} args - Arguments to update or create a Customer.
     * @example
     * // Update or create a Customer
     * const customer = await prisma.customer.upsert({
     *   create: {
     *     // ... data to create a Customer
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Customer we want to update
     *   }
     * })
     */
    upsert<T extends CustomerUpsertArgs>(args: SelectSubset<T, CustomerUpsertArgs<ExtArgs>>): Prisma__CustomerClient<$Result.GetResult<Prisma.$CustomerPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Customers.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerCountArgs} args - Arguments to filter Customers to count.
     * @example
     * // Count the number of Customers
     * const count = await prisma.customer.count({
     *   where: {
     *     // ... the filter for the Customers we want to count
     *   }
     * })
    **/
    count<T extends CustomerCountArgs>(
      args?: Subset<T, CustomerCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CustomerCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Customer.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CustomerAggregateArgs>(args: Subset<T, CustomerAggregateArgs>): Prisma.PrismaPromise<GetCustomerAggregateType<T>>

    /**
     * Group by Customer.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CustomerGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CustomerGroupByArgs['orderBy'] }
        : { orderBy?: CustomerGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CustomerGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCustomerGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Customer model
   */
  readonly fields: CustomerFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Customer.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CustomerClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Customer model
   */
  interface CustomerFieldRefs {
    readonly id: FieldRef<"Customer", 'String'>
    readonly name: FieldRef<"Customer", 'String'>
    readonly email: FieldRef<"Customer", 'String'>
    readonly phone: FieldRef<"Customer", 'String'>
    readonly whatsapp: FieldRef<"Customer", 'String'>
    readonly company: FieldRef<"Customer", 'String'>
    readonly role: FieldRef<"Customer", 'String'>
    readonly status: FieldRef<"Customer", 'String'>
    readonly tags: FieldRef<"Customer", 'Json'>
    readonly notes: FieldRef<"Customer", 'String'>
    readonly source: FieldRef<"Customer", 'String'>
    readonly leadScore: FieldRef<"Customer", 'Int'>
    readonly createdAt: FieldRef<"Customer", 'DateTime'>
    readonly updatedAt: FieldRef<"Customer", 'DateTime'>
    readonly lastContactAt: FieldRef<"Customer", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Customer findUnique
   */
  export type CustomerFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Filter, which Customer to fetch.
     */
    where: CustomerWhereUniqueInput
  }

  /**
   * Customer findUniqueOrThrow
   */
  export type CustomerFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Filter, which Customer to fetch.
     */
    where: CustomerWhereUniqueInput
  }

  /**
   * Customer findFirst
   */
  export type CustomerFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Filter, which Customer to fetch.
     */
    where?: CustomerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Customers to fetch.
     */
    orderBy?: CustomerOrderByWithRelationInput | CustomerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Customers.
     */
    cursor?: CustomerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Customers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Customers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Customers.
     */
    distinct?: CustomerScalarFieldEnum | CustomerScalarFieldEnum[]
  }

  /**
   * Customer findFirstOrThrow
   */
  export type CustomerFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Filter, which Customer to fetch.
     */
    where?: CustomerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Customers to fetch.
     */
    orderBy?: CustomerOrderByWithRelationInput | CustomerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Customers.
     */
    cursor?: CustomerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Customers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Customers.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Customers.
     */
    distinct?: CustomerScalarFieldEnum | CustomerScalarFieldEnum[]
  }

  /**
   * Customer findMany
   */
  export type CustomerFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Filter, which Customers to fetch.
     */
    where?: CustomerWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Customers to fetch.
     */
    orderBy?: CustomerOrderByWithRelationInput | CustomerOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Customers.
     */
    cursor?: CustomerWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Customers from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Customers.
     */
    skip?: number
    distinct?: CustomerScalarFieldEnum | CustomerScalarFieldEnum[]
  }

  /**
   * Customer create
   */
  export type CustomerCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * The data needed to create a Customer.
     */
    data: XOR<CustomerCreateInput, CustomerUncheckedCreateInput>
  }

  /**
   * Customer createMany
   */
  export type CustomerCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Customers.
     */
    data: CustomerCreateManyInput | CustomerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Customer createManyAndReturn
   */
  export type CustomerCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * The data used to create many Customers.
     */
    data: CustomerCreateManyInput | CustomerCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Customer update
   */
  export type CustomerUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * The data needed to update a Customer.
     */
    data: XOR<CustomerUpdateInput, CustomerUncheckedUpdateInput>
    /**
     * Choose, which Customer to update.
     */
    where: CustomerWhereUniqueInput
  }

  /**
   * Customer updateMany
   */
  export type CustomerUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Customers.
     */
    data: XOR<CustomerUpdateManyMutationInput, CustomerUncheckedUpdateManyInput>
    /**
     * Filter which Customers to update
     */
    where?: CustomerWhereInput
    /**
     * Limit how many Customers to update.
     */
    limit?: number
  }

  /**
   * Customer updateManyAndReturn
   */
  export type CustomerUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * The data used to update Customers.
     */
    data: XOR<CustomerUpdateManyMutationInput, CustomerUncheckedUpdateManyInput>
    /**
     * Filter which Customers to update
     */
    where?: CustomerWhereInput
    /**
     * Limit how many Customers to update.
     */
    limit?: number
  }

  /**
   * Customer upsert
   */
  export type CustomerUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * The filter to search for the Customer to update in case it exists.
     */
    where: CustomerWhereUniqueInput
    /**
     * In case the Customer found by the `where` argument doesn't exist, create a new Customer with this data.
     */
    create: XOR<CustomerCreateInput, CustomerUncheckedCreateInput>
    /**
     * In case the Customer was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CustomerUpdateInput, CustomerUncheckedUpdateInput>
  }

  /**
   * Customer delete
   */
  export type CustomerDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
    /**
     * Filter which Customer to delete.
     */
    where: CustomerWhereUniqueInput
  }

  /**
   * Customer deleteMany
   */
  export type CustomerDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Customers to delete
     */
    where?: CustomerWhereInput
    /**
     * Limit how many Customers to delete.
     */
    limit?: number
  }

  /**
   * Customer without action
   */
  export type CustomerDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Customer
     */
    select?: CustomerSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Customer
     */
    omit?: CustomerOmit<ExtArgs> | null
  }


  /**
   * Model CustomerNote
   */

  export type AggregateCustomerNote = {
    _count: CustomerNoteCountAggregateOutputType | null
    _min: CustomerNoteMinAggregateOutputType | null
    _max: CustomerNoteMaxAggregateOutputType | null
  }

  export type CustomerNoteMinAggregateOutputType = {
    id: string | null
    customerId: string | null
    author: string | null
    body: string | null
    context: string | null
    createdAt: Date | null
  }

  export type CustomerNoteMaxAggregateOutputType = {
    id: string | null
    customerId: string | null
    author: string | null
    body: string | null
    context: string | null
    createdAt: Date | null
  }

  export type CustomerNoteCountAggregateOutputType = {
    id: number
    customerId: number
    author: number
    body: number
    context: number
    createdAt: number
    _all: number
  }


  export type CustomerNoteMinAggregateInputType = {
    id?: true
    customerId?: true
    author?: true
    body?: true
    context?: true
    createdAt?: true
  }

  export type CustomerNoteMaxAggregateInputType = {
    id?: true
    customerId?: true
    author?: true
    body?: true
    context?: true
    createdAt?: true
  }

  export type CustomerNoteCountAggregateInputType = {
    id?: true
    customerId?: true
    author?: true
    body?: true
    context?: true
    createdAt?: true
    _all?: true
  }

  export type CustomerNoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerNote to aggregate.
     */
    where?: CustomerNoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerNotes to fetch.
     */
    orderBy?: CustomerNoteOrderByWithRelationInput | CustomerNoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CustomerNoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerNotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerNotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CustomerNotes
    **/
    _count?: true | CustomerNoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CustomerNoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CustomerNoteMaxAggregateInputType
  }

  export type GetCustomerNoteAggregateType<T extends CustomerNoteAggregateArgs> = {
        [P in keyof T & keyof AggregateCustomerNote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCustomerNote[P]>
      : GetScalarType<T[P], AggregateCustomerNote[P]>
  }




  export type CustomerNoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CustomerNoteWhereInput
    orderBy?: CustomerNoteOrderByWithAggregationInput | CustomerNoteOrderByWithAggregationInput[]
    by: CustomerNoteScalarFieldEnum[] | CustomerNoteScalarFieldEnum
    having?: CustomerNoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CustomerNoteCountAggregateInputType | true
    _min?: CustomerNoteMinAggregateInputType
    _max?: CustomerNoteMaxAggregateInputType
  }

  export type CustomerNoteGroupByOutputType = {
    id: string
    customerId: string
    author: string
    body: string
    context: string | null
    createdAt: Date
    _count: CustomerNoteCountAggregateOutputType | null
    _min: CustomerNoteMinAggregateOutputType | null
    _max: CustomerNoteMaxAggregateOutputType | null
  }

  type GetCustomerNoteGroupByPayload<T extends CustomerNoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CustomerNoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CustomerNoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CustomerNoteGroupByOutputType[P]>
            : GetScalarType<T[P], CustomerNoteGroupByOutputType[P]>
        }
      >
    >


  export type CustomerNoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerId?: boolean
    author?: boolean
    body?: boolean
    context?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["customerNote"]>

  export type CustomerNoteSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerId?: boolean
    author?: boolean
    body?: boolean
    context?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["customerNote"]>

  export type CustomerNoteSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerId?: boolean
    author?: boolean
    body?: boolean
    context?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["customerNote"]>

  export type CustomerNoteSelectScalar = {
    id?: boolean
    customerId?: boolean
    author?: boolean
    body?: boolean
    context?: boolean
    createdAt?: boolean
  }

  export type CustomerNoteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "customerId" | "author" | "body" | "context" | "createdAt", ExtArgs["result"]["customerNote"]>

  export type $CustomerNotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CustomerNote"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      customerId: string
      author: string
      body: string
      context: string | null
      createdAt: Date
    }, ExtArgs["result"]["customerNote"]>
    composites: {}
  }

  type CustomerNoteGetPayload<S extends boolean | null | undefined | CustomerNoteDefaultArgs> = $Result.GetResult<Prisma.$CustomerNotePayload, S>

  type CustomerNoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CustomerNoteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CustomerNoteCountAggregateInputType | true
    }

  export interface CustomerNoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CustomerNote'], meta: { name: 'CustomerNote' } }
    /**
     * Find zero or one CustomerNote that matches the filter.
     * @param {CustomerNoteFindUniqueArgs} args - Arguments to find a CustomerNote
     * @example
     * // Get one CustomerNote
     * const customerNote = await prisma.customerNote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CustomerNoteFindUniqueArgs>(args: SelectSubset<T, CustomerNoteFindUniqueArgs<ExtArgs>>): Prisma__CustomerNoteClient<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CustomerNote that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CustomerNoteFindUniqueOrThrowArgs} args - Arguments to find a CustomerNote
     * @example
     * // Get one CustomerNote
     * const customerNote = await prisma.customerNote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CustomerNoteFindUniqueOrThrowArgs>(args: SelectSubset<T, CustomerNoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CustomerNoteClient<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CustomerNote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerNoteFindFirstArgs} args - Arguments to find a CustomerNote
     * @example
     * // Get one CustomerNote
     * const customerNote = await prisma.customerNote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CustomerNoteFindFirstArgs>(args?: SelectSubset<T, CustomerNoteFindFirstArgs<ExtArgs>>): Prisma__CustomerNoteClient<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CustomerNote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerNoteFindFirstOrThrowArgs} args - Arguments to find a CustomerNote
     * @example
     * // Get one CustomerNote
     * const customerNote = await prisma.customerNote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CustomerNoteFindFirstOrThrowArgs>(args?: SelectSubset<T, CustomerNoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__CustomerNoteClient<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CustomerNotes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerNoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CustomerNotes
     * const customerNotes = await prisma.customerNote.findMany()
     * 
     * // Get first 10 CustomerNotes
     * const customerNotes = await prisma.customerNote.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const customerNoteWithIdOnly = await prisma.customerNote.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CustomerNoteFindManyArgs>(args?: SelectSubset<T, CustomerNoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CustomerNote.
     * @param {CustomerNoteCreateArgs} args - Arguments to create a CustomerNote.
     * @example
     * // Create one CustomerNote
     * const CustomerNote = await prisma.customerNote.create({
     *   data: {
     *     // ... data to create a CustomerNote
     *   }
     * })
     * 
     */
    create<T extends CustomerNoteCreateArgs>(args: SelectSubset<T, CustomerNoteCreateArgs<ExtArgs>>): Prisma__CustomerNoteClient<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CustomerNotes.
     * @param {CustomerNoteCreateManyArgs} args - Arguments to create many CustomerNotes.
     * @example
     * // Create many CustomerNotes
     * const customerNote = await prisma.customerNote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CustomerNoteCreateManyArgs>(args?: SelectSubset<T, CustomerNoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CustomerNotes and returns the data saved in the database.
     * @param {CustomerNoteCreateManyAndReturnArgs} args - Arguments to create many CustomerNotes.
     * @example
     * // Create many CustomerNotes
     * const customerNote = await prisma.customerNote.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CustomerNotes and only return the `id`
     * const customerNoteWithIdOnly = await prisma.customerNote.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CustomerNoteCreateManyAndReturnArgs>(args?: SelectSubset<T, CustomerNoteCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CustomerNote.
     * @param {CustomerNoteDeleteArgs} args - Arguments to delete one CustomerNote.
     * @example
     * // Delete one CustomerNote
     * const CustomerNote = await prisma.customerNote.delete({
     *   where: {
     *     // ... filter to delete one CustomerNote
     *   }
     * })
     * 
     */
    delete<T extends CustomerNoteDeleteArgs>(args: SelectSubset<T, CustomerNoteDeleteArgs<ExtArgs>>): Prisma__CustomerNoteClient<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CustomerNote.
     * @param {CustomerNoteUpdateArgs} args - Arguments to update one CustomerNote.
     * @example
     * // Update one CustomerNote
     * const customerNote = await prisma.customerNote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CustomerNoteUpdateArgs>(args: SelectSubset<T, CustomerNoteUpdateArgs<ExtArgs>>): Prisma__CustomerNoteClient<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CustomerNotes.
     * @param {CustomerNoteDeleteManyArgs} args - Arguments to filter CustomerNotes to delete.
     * @example
     * // Delete a few CustomerNotes
     * const { count } = await prisma.customerNote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CustomerNoteDeleteManyArgs>(args?: SelectSubset<T, CustomerNoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerNotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerNoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CustomerNotes
     * const customerNote = await prisma.customerNote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CustomerNoteUpdateManyArgs>(args: SelectSubset<T, CustomerNoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerNotes and returns the data updated in the database.
     * @param {CustomerNoteUpdateManyAndReturnArgs} args - Arguments to update many CustomerNotes.
     * @example
     * // Update many CustomerNotes
     * const customerNote = await prisma.customerNote.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CustomerNotes and only return the `id`
     * const customerNoteWithIdOnly = await prisma.customerNote.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CustomerNoteUpdateManyAndReturnArgs>(args: SelectSubset<T, CustomerNoteUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CustomerNote.
     * @param {CustomerNoteUpsertArgs} args - Arguments to update or create a CustomerNote.
     * @example
     * // Update or create a CustomerNote
     * const customerNote = await prisma.customerNote.upsert({
     *   create: {
     *     // ... data to create a CustomerNote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CustomerNote we want to update
     *   }
     * })
     */
    upsert<T extends CustomerNoteUpsertArgs>(args: SelectSubset<T, CustomerNoteUpsertArgs<ExtArgs>>): Prisma__CustomerNoteClient<$Result.GetResult<Prisma.$CustomerNotePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CustomerNotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerNoteCountArgs} args - Arguments to filter CustomerNotes to count.
     * @example
     * // Count the number of CustomerNotes
     * const count = await prisma.customerNote.count({
     *   where: {
     *     // ... the filter for the CustomerNotes we want to count
     *   }
     * })
    **/
    count<T extends CustomerNoteCountArgs>(
      args?: Subset<T, CustomerNoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CustomerNoteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CustomerNote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerNoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CustomerNoteAggregateArgs>(args: Subset<T, CustomerNoteAggregateArgs>): Prisma.PrismaPromise<GetCustomerNoteAggregateType<T>>

    /**
     * Group by CustomerNote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerNoteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CustomerNoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CustomerNoteGroupByArgs['orderBy'] }
        : { orderBy?: CustomerNoteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CustomerNoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCustomerNoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CustomerNote model
   */
  readonly fields: CustomerNoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CustomerNote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CustomerNoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CustomerNote model
   */
  interface CustomerNoteFieldRefs {
    readonly id: FieldRef<"CustomerNote", 'String'>
    readonly customerId: FieldRef<"CustomerNote", 'String'>
    readonly author: FieldRef<"CustomerNote", 'String'>
    readonly body: FieldRef<"CustomerNote", 'String'>
    readonly context: FieldRef<"CustomerNote", 'String'>
    readonly createdAt: FieldRef<"CustomerNote", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CustomerNote findUnique
   */
  export type CustomerNoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * Filter, which CustomerNote to fetch.
     */
    where: CustomerNoteWhereUniqueInput
  }

  /**
   * CustomerNote findUniqueOrThrow
   */
  export type CustomerNoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * Filter, which CustomerNote to fetch.
     */
    where: CustomerNoteWhereUniqueInput
  }

  /**
   * CustomerNote findFirst
   */
  export type CustomerNoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * Filter, which CustomerNote to fetch.
     */
    where?: CustomerNoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerNotes to fetch.
     */
    orderBy?: CustomerNoteOrderByWithRelationInput | CustomerNoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerNotes.
     */
    cursor?: CustomerNoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerNotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerNotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerNotes.
     */
    distinct?: CustomerNoteScalarFieldEnum | CustomerNoteScalarFieldEnum[]
  }

  /**
   * CustomerNote findFirstOrThrow
   */
  export type CustomerNoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * Filter, which CustomerNote to fetch.
     */
    where?: CustomerNoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerNotes to fetch.
     */
    orderBy?: CustomerNoteOrderByWithRelationInput | CustomerNoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerNotes.
     */
    cursor?: CustomerNoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerNotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerNotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerNotes.
     */
    distinct?: CustomerNoteScalarFieldEnum | CustomerNoteScalarFieldEnum[]
  }

  /**
   * CustomerNote findMany
   */
  export type CustomerNoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * Filter, which CustomerNotes to fetch.
     */
    where?: CustomerNoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerNotes to fetch.
     */
    orderBy?: CustomerNoteOrderByWithRelationInput | CustomerNoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CustomerNotes.
     */
    cursor?: CustomerNoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerNotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerNotes.
     */
    skip?: number
    distinct?: CustomerNoteScalarFieldEnum | CustomerNoteScalarFieldEnum[]
  }

  /**
   * CustomerNote create
   */
  export type CustomerNoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * The data needed to create a CustomerNote.
     */
    data: XOR<CustomerNoteCreateInput, CustomerNoteUncheckedCreateInput>
  }

  /**
   * CustomerNote createMany
   */
  export type CustomerNoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CustomerNotes.
     */
    data: CustomerNoteCreateManyInput | CustomerNoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CustomerNote createManyAndReturn
   */
  export type CustomerNoteCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * The data used to create many CustomerNotes.
     */
    data: CustomerNoteCreateManyInput | CustomerNoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CustomerNote update
   */
  export type CustomerNoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * The data needed to update a CustomerNote.
     */
    data: XOR<CustomerNoteUpdateInput, CustomerNoteUncheckedUpdateInput>
    /**
     * Choose, which CustomerNote to update.
     */
    where: CustomerNoteWhereUniqueInput
  }

  /**
   * CustomerNote updateMany
   */
  export type CustomerNoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CustomerNotes.
     */
    data: XOR<CustomerNoteUpdateManyMutationInput, CustomerNoteUncheckedUpdateManyInput>
    /**
     * Filter which CustomerNotes to update
     */
    where?: CustomerNoteWhereInput
    /**
     * Limit how many CustomerNotes to update.
     */
    limit?: number
  }

  /**
   * CustomerNote updateManyAndReturn
   */
  export type CustomerNoteUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * The data used to update CustomerNotes.
     */
    data: XOR<CustomerNoteUpdateManyMutationInput, CustomerNoteUncheckedUpdateManyInput>
    /**
     * Filter which CustomerNotes to update
     */
    where?: CustomerNoteWhereInput
    /**
     * Limit how many CustomerNotes to update.
     */
    limit?: number
  }

  /**
   * CustomerNote upsert
   */
  export type CustomerNoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * The filter to search for the CustomerNote to update in case it exists.
     */
    where: CustomerNoteWhereUniqueInput
    /**
     * In case the CustomerNote found by the `where` argument doesn't exist, create a new CustomerNote with this data.
     */
    create: XOR<CustomerNoteCreateInput, CustomerNoteUncheckedCreateInput>
    /**
     * In case the CustomerNote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CustomerNoteUpdateInput, CustomerNoteUncheckedUpdateInput>
  }

  /**
   * CustomerNote delete
   */
  export type CustomerNoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
    /**
     * Filter which CustomerNote to delete.
     */
    where: CustomerNoteWhereUniqueInput
  }

  /**
   * CustomerNote deleteMany
   */
  export type CustomerNoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerNotes to delete
     */
    where?: CustomerNoteWhereInput
    /**
     * Limit how many CustomerNotes to delete.
     */
    limit?: number
  }

  /**
   * CustomerNote without action
   */
  export type CustomerNoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerNote
     */
    select?: CustomerNoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerNote
     */
    omit?: CustomerNoteOmit<ExtArgs> | null
  }


  /**
   * Model CustomerMessage
   */

  export type AggregateCustomerMessage = {
    _count: CustomerMessageCountAggregateOutputType | null
    _min: CustomerMessageMinAggregateOutputType | null
    _max: CustomerMessageMaxAggregateOutputType | null
  }

  export type CustomerMessageMinAggregateOutputType = {
    id: string | null
    customerId: string | null
    toEmail: string | null
    toPhone: string | null
    channel: string | null
    subject: string | null
    body: string | null
    status: string | null
    error: string | null
    sentAt: Date | null
  }

  export type CustomerMessageMaxAggregateOutputType = {
    id: string | null
    customerId: string | null
    toEmail: string | null
    toPhone: string | null
    channel: string | null
    subject: string | null
    body: string | null
    status: string | null
    error: string | null
    sentAt: Date | null
  }

  export type CustomerMessageCountAggregateOutputType = {
    id: number
    customerId: number
    toEmail: number
    toPhone: number
    channel: number
    subject: number
    body: number
    status: number
    error: number
    sentAt: number
    _all: number
  }


  export type CustomerMessageMinAggregateInputType = {
    id?: true
    customerId?: true
    toEmail?: true
    toPhone?: true
    channel?: true
    subject?: true
    body?: true
    status?: true
    error?: true
    sentAt?: true
  }

  export type CustomerMessageMaxAggregateInputType = {
    id?: true
    customerId?: true
    toEmail?: true
    toPhone?: true
    channel?: true
    subject?: true
    body?: true
    status?: true
    error?: true
    sentAt?: true
  }

  export type CustomerMessageCountAggregateInputType = {
    id?: true
    customerId?: true
    toEmail?: true
    toPhone?: true
    channel?: true
    subject?: true
    body?: true
    status?: true
    error?: true
    sentAt?: true
    _all?: true
  }

  export type CustomerMessageAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerMessage to aggregate.
     */
    where?: CustomerMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerMessages to fetch.
     */
    orderBy?: CustomerMessageOrderByWithRelationInput | CustomerMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CustomerMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned CustomerMessages
    **/
    _count?: true | CustomerMessageCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CustomerMessageMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CustomerMessageMaxAggregateInputType
  }

  export type GetCustomerMessageAggregateType<T extends CustomerMessageAggregateArgs> = {
        [P in keyof T & keyof AggregateCustomerMessage]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCustomerMessage[P]>
      : GetScalarType<T[P], AggregateCustomerMessage[P]>
  }




  export type CustomerMessageGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CustomerMessageWhereInput
    orderBy?: CustomerMessageOrderByWithAggregationInput | CustomerMessageOrderByWithAggregationInput[]
    by: CustomerMessageScalarFieldEnum[] | CustomerMessageScalarFieldEnum
    having?: CustomerMessageScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CustomerMessageCountAggregateInputType | true
    _min?: CustomerMessageMinAggregateInputType
    _max?: CustomerMessageMaxAggregateInputType
  }

  export type CustomerMessageGroupByOutputType = {
    id: string
    customerId: string | null
    toEmail: string
    toPhone: string | null
    channel: string
    subject: string | null
    body: string
    status: string
    error: string | null
    sentAt: Date
    _count: CustomerMessageCountAggregateOutputType | null
    _min: CustomerMessageMinAggregateOutputType | null
    _max: CustomerMessageMaxAggregateOutputType | null
  }

  type GetCustomerMessageGroupByPayload<T extends CustomerMessageGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CustomerMessageGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CustomerMessageGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CustomerMessageGroupByOutputType[P]>
            : GetScalarType<T[P], CustomerMessageGroupByOutputType[P]>
        }
      >
    >


  export type CustomerMessageSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerId?: boolean
    toEmail?: boolean
    toPhone?: boolean
    channel?: boolean
    subject?: boolean
    body?: boolean
    status?: boolean
    error?: boolean
    sentAt?: boolean
  }, ExtArgs["result"]["customerMessage"]>

  export type CustomerMessageSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerId?: boolean
    toEmail?: boolean
    toPhone?: boolean
    channel?: boolean
    subject?: boolean
    body?: boolean
    status?: boolean
    error?: boolean
    sentAt?: boolean
  }, ExtArgs["result"]["customerMessage"]>

  export type CustomerMessageSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    customerId?: boolean
    toEmail?: boolean
    toPhone?: boolean
    channel?: boolean
    subject?: boolean
    body?: boolean
    status?: boolean
    error?: boolean
    sentAt?: boolean
  }, ExtArgs["result"]["customerMessage"]>

  export type CustomerMessageSelectScalar = {
    id?: boolean
    customerId?: boolean
    toEmail?: boolean
    toPhone?: boolean
    channel?: boolean
    subject?: boolean
    body?: boolean
    status?: boolean
    error?: boolean
    sentAt?: boolean
  }

  export type CustomerMessageOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "customerId" | "toEmail" | "toPhone" | "channel" | "subject" | "body" | "status" | "error" | "sentAt", ExtArgs["result"]["customerMessage"]>

  export type $CustomerMessagePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "CustomerMessage"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      customerId: string | null
      toEmail: string
      toPhone: string | null
      channel: string
      subject: string | null
      body: string
      status: string
      error: string | null
      sentAt: Date
    }, ExtArgs["result"]["customerMessage"]>
    composites: {}
  }

  type CustomerMessageGetPayload<S extends boolean | null | undefined | CustomerMessageDefaultArgs> = $Result.GetResult<Prisma.$CustomerMessagePayload, S>

  type CustomerMessageCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CustomerMessageFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CustomerMessageCountAggregateInputType | true
    }

  export interface CustomerMessageDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['CustomerMessage'], meta: { name: 'CustomerMessage' } }
    /**
     * Find zero or one CustomerMessage that matches the filter.
     * @param {CustomerMessageFindUniqueArgs} args - Arguments to find a CustomerMessage
     * @example
     * // Get one CustomerMessage
     * const customerMessage = await prisma.customerMessage.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CustomerMessageFindUniqueArgs>(args: SelectSubset<T, CustomerMessageFindUniqueArgs<ExtArgs>>): Prisma__CustomerMessageClient<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one CustomerMessage that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CustomerMessageFindUniqueOrThrowArgs} args - Arguments to find a CustomerMessage
     * @example
     * // Get one CustomerMessage
     * const customerMessage = await prisma.customerMessage.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CustomerMessageFindUniqueOrThrowArgs>(args: SelectSubset<T, CustomerMessageFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CustomerMessageClient<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CustomerMessage that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerMessageFindFirstArgs} args - Arguments to find a CustomerMessage
     * @example
     * // Get one CustomerMessage
     * const customerMessage = await prisma.customerMessage.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CustomerMessageFindFirstArgs>(args?: SelectSubset<T, CustomerMessageFindFirstArgs<ExtArgs>>): Prisma__CustomerMessageClient<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first CustomerMessage that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerMessageFindFirstOrThrowArgs} args - Arguments to find a CustomerMessage
     * @example
     * // Get one CustomerMessage
     * const customerMessage = await prisma.customerMessage.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CustomerMessageFindFirstOrThrowArgs>(args?: SelectSubset<T, CustomerMessageFindFirstOrThrowArgs<ExtArgs>>): Prisma__CustomerMessageClient<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more CustomerMessages that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerMessageFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all CustomerMessages
     * const customerMessages = await prisma.customerMessage.findMany()
     * 
     * // Get first 10 CustomerMessages
     * const customerMessages = await prisma.customerMessage.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const customerMessageWithIdOnly = await prisma.customerMessage.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CustomerMessageFindManyArgs>(args?: SelectSubset<T, CustomerMessageFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a CustomerMessage.
     * @param {CustomerMessageCreateArgs} args - Arguments to create a CustomerMessage.
     * @example
     * // Create one CustomerMessage
     * const CustomerMessage = await prisma.customerMessage.create({
     *   data: {
     *     // ... data to create a CustomerMessage
     *   }
     * })
     * 
     */
    create<T extends CustomerMessageCreateArgs>(args: SelectSubset<T, CustomerMessageCreateArgs<ExtArgs>>): Prisma__CustomerMessageClient<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many CustomerMessages.
     * @param {CustomerMessageCreateManyArgs} args - Arguments to create many CustomerMessages.
     * @example
     * // Create many CustomerMessages
     * const customerMessage = await prisma.customerMessage.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CustomerMessageCreateManyArgs>(args?: SelectSubset<T, CustomerMessageCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many CustomerMessages and returns the data saved in the database.
     * @param {CustomerMessageCreateManyAndReturnArgs} args - Arguments to create many CustomerMessages.
     * @example
     * // Create many CustomerMessages
     * const customerMessage = await prisma.customerMessage.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many CustomerMessages and only return the `id`
     * const customerMessageWithIdOnly = await prisma.customerMessage.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CustomerMessageCreateManyAndReturnArgs>(args?: SelectSubset<T, CustomerMessageCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a CustomerMessage.
     * @param {CustomerMessageDeleteArgs} args - Arguments to delete one CustomerMessage.
     * @example
     * // Delete one CustomerMessage
     * const CustomerMessage = await prisma.customerMessage.delete({
     *   where: {
     *     // ... filter to delete one CustomerMessage
     *   }
     * })
     * 
     */
    delete<T extends CustomerMessageDeleteArgs>(args: SelectSubset<T, CustomerMessageDeleteArgs<ExtArgs>>): Prisma__CustomerMessageClient<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one CustomerMessage.
     * @param {CustomerMessageUpdateArgs} args - Arguments to update one CustomerMessage.
     * @example
     * // Update one CustomerMessage
     * const customerMessage = await prisma.customerMessage.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CustomerMessageUpdateArgs>(args: SelectSubset<T, CustomerMessageUpdateArgs<ExtArgs>>): Prisma__CustomerMessageClient<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more CustomerMessages.
     * @param {CustomerMessageDeleteManyArgs} args - Arguments to filter CustomerMessages to delete.
     * @example
     * // Delete a few CustomerMessages
     * const { count } = await prisma.customerMessage.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CustomerMessageDeleteManyArgs>(args?: SelectSubset<T, CustomerMessageDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerMessageUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many CustomerMessages
     * const customerMessage = await prisma.customerMessage.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CustomerMessageUpdateManyArgs>(args: SelectSubset<T, CustomerMessageUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more CustomerMessages and returns the data updated in the database.
     * @param {CustomerMessageUpdateManyAndReturnArgs} args - Arguments to update many CustomerMessages.
     * @example
     * // Update many CustomerMessages
     * const customerMessage = await prisma.customerMessage.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more CustomerMessages and only return the `id`
     * const customerMessageWithIdOnly = await prisma.customerMessage.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CustomerMessageUpdateManyAndReturnArgs>(args: SelectSubset<T, CustomerMessageUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one CustomerMessage.
     * @param {CustomerMessageUpsertArgs} args - Arguments to update or create a CustomerMessage.
     * @example
     * // Update or create a CustomerMessage
     * const customerMessage = await prisma.customerMessage.upsert({
     *   create: {
     *     // ... data to create a CustomerMessage
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the CustomerMessage we want to update
     *   }
     * })
     */
    upsert<T extends CustomerMessageUpsertArgs>(args: SelectSubset<T, CustomerMessageUpsertArgs<ExtArgs>>): Prisma__CustomerMessageClient<$Result.GetResult<Prisma.$CustomerMessagePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of CustomerMessages.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerMessageCountArgs} args - Arguments to filter CustomerMessages to count.
     * @example
     * // Count the number of CustomerMessages
     * const count = await prisma.customerMessage.count({
     *   where: {
     *     // ... the filter for the CustomerMessages we want to count
     *   }
     * })
    **/
    count<T extends CustomerMessageCountArgs>(
      args?: Subset<T, CustomerMessageCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CustomerMessageCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a CustomerMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerMessageAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CustomerMessageAggregateArgs>(args: Subset<T, CustomerMessageAggregateArgs>): Prisma.PrismaPromise<GetCustomerMessageAggregateType<T>>

    /**
     * Group by CustomerMessage.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CustomerMessageGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CustomerMessageGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CustomerMessageGroupByArgs['orderBy'] }
        : { orderBy?: CustomerMessageGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CustomerMessageGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCustomerMessageGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the CustomerMessage model
   */
  readonly fields: CustomerMessageFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for CustomerMessage.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CustomerMessageClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the CustomerMessage model
   */
  interface CustomerMessageFieldRefs {
    readonly id: FieldRef<"CustomerMessage", 'String'>
    readonly customerId: FieldRef<"CustomerMessage", 'String'>
    readonly toEmail: FieldRef<"CustomerMessage", 'String'>
    readonly toPhone: FieldRef<"CustomerMessage", 'String'>
    readonly channel: FieldRef<"CustomerMessage", 'String'>
    readonly subject: FieldRef<"CustomerMessage", 'String'>
    readonly body: FieldRef<"CustomerMessage", 'String'>
    readonly status: FieldRef<"CustomerMessage", 'String'>
    readonly error: FieldRef<"CustomerMessage", 'String'>
    readonly sentAt: FieldRef<"CustomerMessage", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * CustomerMessage findUnique
   */
  export type CustomerMessageFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * Filter, which CustomerMessage to fetch.
     */
    where: CustomerMessageWhereUniqueInput
  }

  /**
   * CustomerMessage findUniqueOrThrow
   */
  export type CustomerMessageFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * Filter, which CustomerMessage to fetch.
     */
    where: CustomerMessageWhereUniqueInput
  }

  /**
   * CustomerMessage findFirst
   */
  export type CustomerMessageFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * Filter, which CustomerMessage to fetch.
     */
    where?: CustomerMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerMessages to fetch.
     */
    orderBy?: CustomerMessageOrderByWithRelationInput | CustomerMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerMessages.
     */
    cursor?: CustomerMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerMessages.
     */
    distinct?: CustomerMessageScalarFieldEnum | CustomerMessageScalarFieldEnum[]
  }

  /**
   * CustomerMessage findFirstOrThrow
   */
  export type CustomerMessageFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * Filter, which CustomerMessage to fetch.
     */
    where?: CustomerMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerMessages to fetch.
     */
    orderBy?: CustomerMessageOrderByWithRelationInput | CustomerMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for CustomerMessages.
     */
    cursor?: CustomerMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerMessages.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of CustomerMessages.
     */
    distinct?: CustomerMessageScalarFieldEnum | CustomerMessageScalarFieldEnum[]
  }

  /**
   * CustomerMessage findMany
   */
  export type CustomerMessageFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * Filter, which CustomerMessages to fetch.
     */
    where?: CustomerMessageWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of CustomerMessages to fetch.
     */
    orderBy?: CustomerMessageOrderByWithRelationInput | CustomerMessageOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing CustomerMessages.
     */
    cursor?: CustomerMessageWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` CustomerMessages from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` CustomerMessages.
     */
    skip?: number
    distinct?: CustomerMessageScalarFieldEnum | CustomerMessageScalarFieldEnum[]
  }

  /**
   * CustomerMessage create
   */
  export type CustomerMessageCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * The data needed to create a CustomerMessage.
     */
    data: XOR<CustomerMessageCreateInput, CustomerMessageUncheckedCreateInput>
  }

  /**
   * CustomerMessage createMany
   */
  export type CustomerMessageCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many CustomerMessages.
     */
    data: CustomerMessageCreateManyInput | CustomerMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CustomerMessage createManyAndReturn
   */
  export type CustomerMessageCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * The data used to create many CustomerMessages.
     */
    data: CustomerMessageCreateManyInput | CustomerMessageCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * CustomerMessage update
   */
  export type CustomerMessageUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * The data needed to update a CustomerMessage.
     */
    data: XOR<CustomerMessageUpdateInput, CustomerMessageUncheckedUpdateInput>
    /**
     * Choose, which CustomerMessage to update.
     */
    where: CustomerMessageWhereUniqueInput
  }

  /**
   * CustomerMessage updateMany
   */
  export type CustomerMessageUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update CustomerMessages.
     */
    data: XOR<CustomerMessageUpdateManyMutationInput, CustomerMessageUncheckedUpdateManyInput>
    /**
     * Filter which CustomerMessages to update
     */
    where?: CustomerMessageWhereInput
    /**
     * Limit how many CustomerMessages to update.
     */
    limit?: number
  }

  /**
   * CustomerMessage updateManyAndReturn
   */
  export type CustomerMessageUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * The data used to update CustomerMessages.
     */
    data: XOR<CustomerMessageUpdateManyMutationInput, CustomerMessageUncheckedUpdateManyInput>
    /**
     * Filter which CustomerMessages to update
     */
    where?: CustomerMessageWhereInput
    /**
     * Limit how many CustomerMessages to update.
     */
    limit?: number
  }

  /**
   * CustomerMessage upsert
   */
  export type CustomerMessageUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * The filter to search for the CustomerMessage to update in case it exists.
     */
    where: CustomerMessageWhereUniqueInput
    /**
     * In case the CustomerMessage found by the `where` argument doesn't exist, create a new CustomerMessage with this data.
     */
    create: XOR<CustomerMessageCreateInput, CustomerMessageUncheckedCreateInput>
    /**
     * In case the CustomerMessage was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CustomerMessageUpdateInput, CustomerMessageUncheckedUpdateInput>
  }

  /**
   * CustomerMessage delete
   */
  export type CustomerMessageDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
    /**
     * Filter which CustomerMessage to delete.
     */
    where: CustomerMessageWhereUniqueInput
  }

  /**
   * CustomerMessage deleteMany
   */
  export type CustomerMessageDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which CustomerMessages to delete
     */
    where?: CustomerMessageWhereInput
    /**
     * Limit how many CustomerMessages to delete.
     */
    limit?: number
  }

  /**
   * CustomerMessage without action
   */
  export type CustomerMessageDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CustomerMessage
     */
    select?: CustomerMessageSelect<ExtArgs> | null
    /**
     * Omit specific fields from the CustomerMessage
     */
    omit?: CustomerMessageOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const InquiryScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    phone: 'phone',
    whatsapp: 'whatsapp',
    service: 'service',
    addlService: 'addlService',
    budget: 'budget',
    message: 'message',
    status: 'status',
    source: 'source',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type InquiryScalarFieldEnum = (typeof InquiryScalarFieldEnum)[keyof typeof InquiryScalarFieldEnum]


  export const DraftProposalScalarFieldEnum: {
    id: 'id',
    source: 'source',
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    service: 'service',
    draftJson: 'draftJson',
    leadScore: 'leadScore',
    inquiryId: 'inquiryId',
    receivedEmailId: 'receivedEmailId',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type DraftProposalScalarFieldEnum = (typeof DraftProposalScalarFieldEnum)[keyof typeof DraftProposalScalarFieldEnum]


  export const WebhookLogScalarFieldEnum: {
    id: 'id',
    provider: 'provider',
    event: 'event',
    paystackId: 'paystackId',
    reference: 'reference',
    invoiceId: 'invoiceId',
    invoiceNumber: 'invoiceNumber',
    amountKobo: 'amountKobo',
    currency: 'currency',
    signatureValid: 'signatureValid',
    source: 'source',
    status: 'status',
    result: 'result',
    payload: 'payload',
    error: 'error',
    receivedAt: 'receivedAt',
    processedAt: 'processedAt'
  };

  export type WebhookLogScalarFieldEnum = (typeof WebhookLogScalarFieldEnum)[keyof typeof WebhookLogScalarFieldEnum]


  export const AdminSessionScalarFieldEnum: {
    id: 'id',
    token: 'token',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt'
  };

  export type AdminSessionScalarFieldEnum = (typeof AdminSessionScalarFieldEnum)[keyof typeof AdminSessionScalarFieldEnum]


  export const SubscriberScalarFieldEnum: {
    id: 'id',
    email: 'email',
    status: 'status',
    confirmToken: 'confirmToken',
    unsubscribeToken: 'unsubscribeToken',
    confirmedAt: 'confirmedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type SubscriberScalarFieldEnum = (typeof SubscriberScalarFieldEnum)[keyof typeof SubscriberScalarFieldEnum]


  export const PostScalarFieldEnum: {
    id: 'id',
    title: 'title',
    slug: 'slug',
    excerpt: 'excerpt',
    content: 'content',
    category: 'category',
    tags: 'tags',
    author: 'author',
    status: 'status',
    publishedAt: 'publishedAt',
    notifySentAt: 'notifySentAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PostScalarFieldEnum = (typeof PostScalarFieldEnum)[keyof typeof PostScalarFieldEnum]


  export const TestimonialScalarFieldEnum: {
    id: 'id',
    name: 'name',
    role: 'role',
    service: 'service',
    text: 'text',
    rating: 'rating',
    avatar: 'avatar',
    status: 'status',
    sortOrder: 'sortOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type TestimonialScalarFieldEnum = (typeof TestimonialScalarFieldEnum)[keyof typeof TestimonialScalarFieldEnum]


  export const EmailLogScalarFieldEnum: {
    id: 'id',
    type: 'type',
    recipientEmail: 'recipientEmail',
    subject: 'subject',
    postId: 'postId',
    subscriberId: 'subscriberId',
    status: 'status',
    error: 'error',
    sentAt: 'sentAt',
    bodyText: 'bodyText',
    bodyHtml: 'bodyHtml',
    attachments: 'attachments',
    invoiceId: 'invoiceId',
    provider: 'provider'
  };

  export type EmailLogScalarFieldEnum = (typeof EmailLogScalarFieldEnum)[keyof typeof EmailLogScalarFieldEnum]


  export const EmailProviderConfigScalarFieldEnum: {
    id: 'id',
    provider: 'provider',
    displayName: 'displayName',
    priority: 'priority',
    enabled: 'enabled',
    credentialsEnc: 'credentialsEnc',
    lastTestAt: 'lastTestAt',
    lastTestStatus: 'lastTestStatus',
    lastTestError: 'lastTestError',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type EmailProviderConfigScalarFieldEnum = (typeof EmailProviderConfigScalarFieldEnum)[keyof typeof EmailProviderConfigScalarFieldEnum]


  export const ReceivedEmailScalarFieldEnum: {
    id: 'id',
    source: 'source',
    name: 'name',
    email: 'email',
    phone: 'phone',
    subject: 'subject',
    message: 'message',
    leadScore: 'leadScore',
    meta: 'meta',
    inquiryId: 'inquiryId',
    createdAt: 'createdAt'
  };

  export type ReceivedEmailScalarFieldEnum = (typeof ReceivedEmailScalarFieldEnum)[keyof typeof ReceivedEmailScalarFieldEnum]


  export const InvoiceScalarFieldEnum: {
    id: 'id',
    invoiceNumber: 'invoiceNumber',
    inquiryId: 'inquiryId',
    customerName: 'customerName',
    customerEmail: 'customerEmail',
    customerPhone: 'customerPhone',
    service: 'service',
    description: 'description',
    proposalJson: 'proposalJson',
    amountKobo: 'amountKobo',
    currency: 'currency',
    durationLabel: 'durationLabel',
    dueDate: 'dueDate',
    status: 'status',
    dvaAccountNumber: 'dvaAccountNumber',
    dvaBankName: 'dvaBankName',
    dvaBankCode: 'dvaBankCode',
    paystackReference: 'paystackReference',
    pdfUrl: 'pdfUrl',
    pdfStorage: 'pdfStorage',
    secureToken: 'secureToken',
    portalViewedAt: 'portalViewedAt',
    paymentProofUrl: 'paymentProofUrl',
    paymentProofName: 'paymentProofName',
    paymentProofUploadedAt: 'paymentProofUploadedAt',
    paidAt: 'paidAt',
    sentAt: 'sentAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type InvoiceScalarFieldEnum = (typeof InvoiceScalarFieldEnum)[keyof typeof InvoiceScalarFieldEnum]


  export const EventRecordScalarFieldEnum: {
    id: 'id',
    type: 'type',
    customerEmail: 'customerEmail',
    customerPhone: 'customerPhone',
    eventDate: 'eventDate',
    relatedInvoiceId: 'relatedInvoiceId',
    payload: 'payload',
    status: 'status',
    processedAt: 'processedAt',
    lastSentAt: 'lastSentAt',
    createdAt: 'createdAt'
  };

  export type EventRecordScalarFieldEnum = (typeof EventRecordScalarFieldEnum)[keyof typeof EventRecordScalarFieldEnum]


  export const WhatsAppMessageScalarFieldEnum: {
    id: 'id',
    direction: 'direction',
    toPhone: 'toPhone',
    fromPhone: 'fromPhone',
    messageText: 'messageText',
    mediaUrl: 'mediaUrl',
    mediaFilename: 'mediaFilename',
    relatedInvoiceId: 'relatedInvoiceId',
    status: 'status',
    sentAt: 'sentAt'
  };

  export type WhatsAppMessageScalarFieldEnum = (typeof WhatsAppMessageScalarFieldEnum)[keyof typeof WhatsAppMessageScalarFieldEnum]


  export const AnalyticsEventScalarFieldEnum: {
    id: 'id',
    type: 'type',
    invoiceId: 'invoiceId',
    secureToken: 'secureToken',
    sessionId: 'sessionId',
    meta: 'meta',
    createdAt: 'createdAt'
  };

  export type AnalyticsEventScalarFieldEnum = (typeof AnalyticsEventScalarFieldEnum)[keyof typeof AnalyticsEventScalarFieldEnum]


  export const BackupLogScalarFieldEnum: {
    id: 'id',
    kind: 'kind',
    target: 'target',
    status: 'status',
    fileName: 'fileName',
    sizeBytes: 'sizeBytes',
    durationMs: 'durationMs',
    error: 'error',
    createdAt: 'createdAt'
  };

  export type BackupLogScalarFieldEnum = (typeof BackupLogScalarFieldEnum)[keyof typeof BackupLogScalarFieldEnum]


  export const CustomerScalarFieldEnum: {
    id: 'id',
    name: 'name',
    email: 'email',
    phone: 'phone',
    whatsapp: 'whatsapp',
    company: 'company',
    role: 'role',
    status: 'status',
    tags: 'tags',
    notes: 'notes',
    source: 'source',
    leadScore: 'leadScore',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    lastContactAt: 'lastContactAt'
  };

  export type CustomerScalarFieldEnum = (typeof CustomerScalarFieldEnum)[keyof typeof CustomerScalarFieldEnum]


  export const CustomerNoteScalarFieldEnum: {
    id: 'id',
    customerId: 'customerId',
    author: 'author',
    body: 'body',
    context: 'context',
    createdAt: 'createdAt'
  };

  export type CustomerNoteScalarFieldEnum = (typeof CustomerNoteScalarFieldEnum)[keyof typeof CustomerNoteScalarFieldEnum]


  export const CustomerMessageScalarFieldEnum: {
    id: 'id',
    customerId: 'customerId',
    toEmail: 'toEmail',
    toPhone: 'toPhone',
    channel: 'channel',
    subject: 'subject',
    body: 'body',
    status: 'status',
    error: 'error',
    sentAt: 'sentAt'
  };

  export type CustomerMessageScalarFieldEnum = (typeof CustomerMessageScalarFieldEnum)[keyof typeof CustomerMessageScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type InquiryWhereInput = {
    AND?: InquiryWhereInput | InquiryWhereInput[]
    OR?: InquiryWhereInput[]
    NOT?: InquiryWhereInput | InquiryWhereInput[]
    id?: StringFilter<"Inquiry"> | string
    name?: StringFilter<"Inquiry"> | string
    email?: StringFilter<"Inquiry"> | string
    phone?: StringNullableFilter<"Inquiry"> | string | null
    whatsapp?: StringNullableFilter<"Inquiry"> | string | null
    service?: StringFilter<"Inquiry"> | string
    addlService?: StringNullableFilter<"Inquiry"> | string | null
    budget?: StringNullableFilter<"Inquiry"> | string | null
    message?: StringFilter<"Inquiry"> | string
    status?: StringFilter<"Inquiry"> | string
    source?: StringFilter<"Inquiry"> | string
    createdAt?: DateTimeFilter<"Inquiry"> | Date | string
    updatedAt?: DateTimeFilter<"Inquiry"> | Date | string
  }

  export type InquiryOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    whatsapp?: SortOrderInput | SortOrder
    service?: SortOrder
    addlService?: SortOrderInput | SortOrder
    budget?: SortOrderInput | SortOrder
    message?: SortOrder
    status?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InquiryWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: InquiryWhereInput | InquiryWhereInput[]
    OR?: InquiryWhereInput[]
    NOT?: InquiryWhereInput | InquiryWhereInput[]
    name?: StringFilter<"Inquiry"> | string
    email?: StringFilter<"Inquiry"> | string
    phone?: StringNullableFilter<"Inquiry"> | string | null
    whatsapp?: StringNullableFilter<"Inquiry"> | string | null
    service?: StringFilter<"Inquiry"> | string
    addlService?: StringNullableFilter<"Inquiry"> | string | null
    budget?: StringNullableFilter<"Inquiry"> | string | null
    message?: StringFilter<"Inquiry"> | string
    status?: StringFilter<"Inquiry"> | string
    source?: StringFilter<"Inquiry"> | string
    createdAt?: DateTimeFilter<"Inquiry"> | Date | string
    updatedAt?: DateTimeFilter<"Inquiry"> | Date | string
  }, "id">

  export type InquiryOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    whatsapp?: SortOrderInput | SortOrder
    service?: SortOrder
    addlService?: SortOrderInput | SortOrder
    budget?: SortOrderInput | SortOrder
    message?: SortOrder
    status?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InquiryCountOrderByAggregateInput
    _max?: InquiryMaxOrderByAggregateInput
    _min?: InquiryMinOrderByAggregateInput
  }

  export type InquiryScalarWhereWithAggregatesInput = {
    AND?: InquiryScalarWhereWithAggregatesInput | InquiryScalarWhereWithAggregatesInput[]
    OR?: InquiryScalarWhereWithAggregatesInput[]
    NOT?: InquiryScalarWhereWithAggregatesInput | InquiryScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Inquiry"> | string
    name?: StringWithAggregatesFilter<"Inquiry"> | string
    email?: StringWithAggregatesFilter<"Inquiry"> | string
    phone?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    whatsapp?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    service?: StringWithAggregatesFilter<"Inquiry"> | string
    addlService?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    budget?: StringNullableWithAggregatesFilter<"Inquiry"> | string | null
    message?: StringWithAggregatesFilter<"Inquiry"> | string
    status?: StringWithAggregatesFilter<"Inquiry"> | string
    source?: StringWithAggregatesFilter<"Inquiry"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Inquiry"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Inquiry"> | Date | string
  }

  export type DraftProposalWhereInput = {
    AND?: DraftProposalWhereInput | DraftProposalWhereInput[]
    OR?: DraftProposalWhereInput[]
    NOT?: DraftProposalWhereInput | DraftProposalWhereInput[]
    id?: StringFilter<"DraftProposal"> | string
    source?: StringFilter<"DraftProposal"> | string
    customerName?: StringFilter<"DraftProposal"> | string
    customerEmail?: StringFilter<"DraftProposal"> | string
    service?: StringFilter<"DraftProposal"> | string
    draftJson?: JsonFilter<"DraftProposal">
    leadScore?: IntNullableFilter<"DraftProposal"> | number | null
    inquiryId?: StringNullableFilter<"DraftProposal"> | string | null
    receivedEmailId?: StringNullableFilter<"DraftProposal"> | string | null
    status?: StringFilter<"DraftProposal"> | string
    createdAt?: DateTimeFilter<"DraftProposal"> | Date | string
    updatedAt?: DateTimeFilter<"DraftProposal"> | Date | string
  }

  export type DraftProposalOrderByWithRelationInput = {
    id?: SortOrder
    source?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    service?: SortOrder
    draftJson?: SortOrder
    leadScore?: SortOrderInput | SortOrder
    inquiryId?: SortOrderInput | SortOrder
    receivedEmailId?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DraftProposalWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    inquiryId?: string
    AND?: DraftProposalWhereInput | DraftProposalWhereInput[]
    OR?: DraftProposalWhereInput[]
    NOT?: DraftProposalWhereInput | DraftProposalWhereInput[]
    source?: StringFilter<"DraftProposal"> | string
    customerName?: StringFilter<"DraftProposal"> | string
    customerEmail?: StringFilter<"DraftProposal"> | string
    service?: StringFilter<"DraftProposal"> | string
    draftJson?: JsonFilter<"DraftProposal">
    leadScore?: IntNullableFilter<"DraftProposal"> | number | null
    receivedEmailId?: StringNullableFilter<"DraftProposal"> | string | null
    status?: StringFilter<"DraftProposal"> | string
    createdAt?: DateTimeFilter<"DraftProposal"> | Date | string
    updatedAt?: DateTimeFilter<"DraftProposal"> | Date | string
  }, "id" | "inquiryId">

  export type DraftProposalOrderByWithAggregationInput = {
    id?: SortOrder
    source?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    service?: SortOrder
    draftJson?: SortOrder
    leadScore?: SortOrderInput | SortOrder
    inquiryId?: SortOrderInput | SortOrder
    receivedEmailId?: SortOrderInput | SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: DraftProposalCountOrderByAggregateInput
    _avg?: DraftProposalAvgOrderByAggregateInput
    _max?: DraftProposalMaxOrderByAggregateInput
    _min?: DraftProposalMinOrderByAggregateInput
    _sum?: DraftProposalSumOrderByAggregateInput
  }

  export type DraftProposalScalarWhereWithAggregatesInput = {
    AND?: DraftProposalScalarWhereWithAggregatesInput | DraftProposalScalarWhereWithAggregatesInput[]
    OR?: DraftProposalScalarWhereWithAggregatesInput[]
    NOT?: DraftProposalScalarWhereWithAggregatesInput | DraftProposalScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"DraftProposal"> | string
    source?: StringWithAggregatesFilter<"DraftProposal"> | string
    customerName?: StringWithAggregatesFilter<"DraftProposal"> | string
    customerEmail?: StringWithAggregatesFilter<"DraftProposal"> | string
    service?: StringWithAggregatesFilter<"DraftProposal"> | string
    draftJson?: JsonWithAggregatesFilter<"DraftProposal">
    leadScore?: IntNullableWithAggregatesFilter<"DraftProposal"> | number | null
    inquiryId?: StringNullableWithAggregatesFilter<"DraftProposal"> | string | null
    receivedEmailId?: StringNullableWithAggregatesFilter<"DraftProposal"> | string | null
    status?: StringWithAggregatesFilter<"DraftProposal"> | string
    createdAt?: DateTimeWithAggregatesFilter<"DraftProposal"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"DraftProposal"> | Date | string
  }

  export type WebhookLogWhereInput = {
    AND?: WebhookLogWhereInput | WebhookLogWhereInput[]
    OR?: WebhookLogWhereInput[]
    NOT?: WebhookLogWhereInput | WebhookLogWhereInput[]
    id?: StringFilter<"WebhookLog"> | string
    provider?: StringFilter<"WebhookLog"> | string
    event?: StringFilter<"WebhookLog"> | string
    paystackId?: StringNullableFilter<"WebhookLog"> | string | null
    reference?: StringNullableFilter<"WebhookLog"> | string | null
    invoiceId?: StringNullableFilter<"WebhookLog"> | string | null
    invoiceNumber?: StringNullableFilter<"WebhookLog"> | string | null
    amountKobo?: IntNullableFilter<"WebhookLog"> | number | null
    currency?: StringNullableFilter<"WebhookLog"> | string | null
    signatureValid?: BoolFilter<"WebhookLog"> | boolean
    source?: StringFilter<"WebhookLog"> | string
    status?: StringFilter<"WebhookLog"> | string
    result?: JsonFilter<"WebhookLog">
    payload?: JsonFilter<"WebhookLog">
    error?: StringNullableFilter<"WebhookLog"> | string | null
    receivedAt?: DateTimeFilter<"WebhookLog"> | Date | string
    processedAt?: DateTimeNullableFilter<"WebhookLog"> | Date | string | null
  }

  export type WebhookLogOrderByWithRelationInput = {
    id?: SortOrder
    provider?: SortOrder
    event?: SortOrder
    paystackId?: SortOrderInput | SortOrder
    reference?: SortOrderInput | SortOrder
    invoiceId?: SortOrderInput | SortOrder
    invoiceNumber?: SortOrderInput | SortOrder
    amountKobo?: SortOrderInput | SortOrder
    currency?: SortOrderInput | SortOrder
    signatureValid?: SortOrder
    source?: SortOrder
    status?: SortOrder
    result?: SortOrder
    payload?: SortOrder
    error?: SortOrderInput | SortOrder
    receivedAt?: SortOrder
    processedAt?: SortOrderInput | SortOrder
  }

  export type WebhookLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    provider_event_paystackId?: WebhookLogProviderEventPaystackIdCompoundUniqueInput
    AND?: WebhookLogWhereInput | WebhookLogWhereInput[]
    OR?: WebhookLogWhereInput[]
    NOT?: WebhookLogWhereInput | WebhookLogWhereInput[]
    provider?: StringFilter<"WebhookLog"> | string
    event?: StringFilter<"WebhookLog"> | string
    paystackId?: StringNullableFilter<"WebhookLog"> | string | null
    reference?: StringNullableFilter<"WebhookLog"> | string | null
    invoiceId?: StringNullableFilter<"WebhookLog"> | string | null
    invoiceNumber?: StringNullableFilter<"WebhookLog"> | string | null
    amountKobo?: IntNullableFilter<"WebhookLog"> | number | null
    currency?: StringNullableFilter<"WebhookLog"> | string | null
    signatureValid?: BoolFilter<"WebhookLog"> | boolean
    source?: StringFilter<"WebhookLog"> | string
    status?: StringFilter<"WebhookLog"> | string
    result?: JsonFilter<"WebhookLog">
    payload?: JsonFilter<"WebhookLog">
    error?: StringNullableFilter<"WebhookLog"> | string | null
    receivedAt?: DateTimeFilter<"WebhookLog"> | Date | string
    processedAt?: DateTimeNullableFilter<"WebhookLog"> | Date | string | null
  }, "id" | "provider_event_paystackId">

  export type WebhookLogOrderByWithAggregationInput = {
    id?: SortOrder
    provider?: SortOrder
    event?: SortOrder
    paystackId?: SortOrderInput | SortOrder
    reference?: SortOrderInput | SortOrder
    invoiceId?: SortOrderInput | SortOrder
    invoiceNumber?: SortOrderInput | SortOrder
    amountKobo?: SortOrderInput | SortOrder
    currency?: SortOrderInput | SortOrder
    signatureValid?: SortOrder
    source?: SortOrder
    status?: SortOrder
    result?: SortOrder
    payload?: SortOrder
    error?: SortOrderInput | SortOrder
    receivedAt?: SortOrder
    processedAt?: SortOrderInput | SortOrder
    _count?: WebhookLogCountOrderByAggregateInput
    _avg?: WebhookLogAvgOrderByAggregateInput
    _max?: WebhookLogMaxOrderByAggregateInput
    _min?: WebhookLogMinOrderByAggregateInput
    _sum?: WebhookLogSumOrderByAggregateInput
  }

  export type WebhookLogScalarWhereWithAggregatesInput = {
    AND?: WebhookLogScalarWhereWithAggregatesInput | WebhookLogScalarWhereWithAggregatesInput[]
    OR?: WebhookLogScalarWhereWithAggregatesInput[]
    NOT?: WebhookLogScalarWhereWithAggregatesInput | WebhookLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WebhookLog"> | string
    provider?: StringWithAggregatesFilter<"WebhookLog"> | string
    event?: StringWithAggregatesFilter<"WebhookLog"> | string
    paystackId?: StringNullableWithAggregatesFilter<"WebhookLog"> | string | null
    reference?: StringNullableWithAggregatesFilter<"WebhookLog"> | string | null
    invoiceId?: StringNullableWithAggregatesFilter<"WebhookLog"> | string | null
    invoiceNumber?: StringNullableWithAggregatesFilter<"WebhookLog"> | string | null
    amountKobo?: IntNullableWithAggregatesFilter<"WebhookLog"> | number | null
    currency?: StringNullableWithAggregatesFilter<"WebhookLog"> | string | null
    signatureValid?: BoolWithAggregatesFilter<"WebhookLog"> | boolean
    source?: StringWithAggregatesFilter<"WebhookLog"> | string
    status?: StringWithAggregatesFilter<"WebhookLog"> | string
    result?: JsonWithAggregatesFilter<"WebhookLog">
    payload?: JsonWithAggregatesFilter<"WebhookLog">
    error?: StringNullableWithAggregatesFilter<"WebhookLog"> | string | null
    receivedAt?: DateTimeWithAggregatesFilter<"WebhookLog"> | Date | string
    processedAt?: DateTimeNullableWithAggregatesFilter<"WebhookLog"> | Date | string | null
  }

  export type AdminSessionWhereInput = {
    AND?: AdminSessionWhereInput | AdminSessionWhereInput[]
    OR?: AdminSessionWhereInput[]
    NOT?: AdminSessionWhereInput | AdminSessionWhereInput[]
    id?: StringFilter<"AdminSession"> | string
    token?: StringFilter<"AdminSession"> | string
    expiresAt?: DateTimeFilter<"AdminSession"> | Date | string
    createdAt?: DateTimeFilter<"AdminSession"> | Date | string
  }

  export type AdminSessionOrderByWithRelationInput = {
    id?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type AdminSessionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    token?: string
    AND?: AdminSessionWhereInput | AdminSessionWhereInput[]
    OR?: AdminSessionWhereInput[]
    NOT?: AdminSessionWhereInput | AdminSessionWhereInput[]
    expiresAt?: DateTimeFilter<"AdminSession"> | Date | string
    createdAt?: DateTimeFilter<"AdminSession"> | Date | string
  }, "id" | "token">

  export type AdminSessionOrderByWithAggregationInput = {
    id?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    _count?: AdminSessionCountOrderByAggregateInput
    _max?: AdminSessionMaxOrderByAggregateInput
    _min?: AdminSessionMinOrderByAggregateInput
  }

  export type AdminSessionScalarWhereWithAggregatesInput = {
    AND?: AdminSessionScalarWhereWithAggregatesInput | AdminSessionScalarWhereWithAggregatesInput[]
    OR?: AdminSessionScalarWhereWithAggregatesInput[]
    NOT?: AdminSessionScalarWhereWithAggregatesInput | AdminSessionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AdminSession"> | string
    token?: StringWithAggregatesFilter<"AdminSession"> | string
    expiresAt?: DateTimeWithAggregatesFilter<"AdminSession"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"AdminSession"> | Date | string
  }

  export type SubscriberWhereInput = {
    AND?: SubscriberWhereInput | SubscriberWhereInput[]
    OR?: SubscriberWhereInput[]
    NOT?: SubscriberWhereInput | SubscriberWhereInput[]
    id?: StringFilter<"Subscriber"> | string
    email?: StringFilter<"Subscriber"> | string
    status?: StringFilter<"Subscriber"> | string
    confirmToken?: StringNullableFilter<"Subscriber"> | string | null
    unsubscribeToken?: StringNullableFilter<"Subscriber"> | string | null
    confirmedAt?: DateTimeNullableFilter<"Subscriber"> | Date | string | null
    createdAt?: DateTimeFilter<"Subscriber"> | Date | string
    updatedAt?: DateTimeFilter<"Subscriber"> | Date | string
  }

  export type SubscriberOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    status?: SortOrder
    confirmToken?: SortOrderInput | SortOrder
    unsubscribeToken?: SortOrderInput | SortOrder
    confirmedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubscriberWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    confirmToken?: string
    unsubscribeToken?: string
    AND?: SubscriberWhereInput | SubscriberWhereInput[]
    OR?: SubscriberWhereInput[]
    NOT?: SubscriberWhereInput | SubscriberWhereInput[]
    status?: StringFilter<"Subscriber"> | string
    confirmedAt?: DateTimeNullableFilter<"Subscriber"> | Date | string | null
    createdAt?: DateTimeFilter<"Subscriber"> | Date | string
    updatedAt?: DateTimeFilter<"Subscriber"> | Date | string
  }, "id" | "email" | "confirmToken" | "unsubscribeToken">

  export type SubscriberOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    status?: SortOrder
    confirmToken?: SortOrderInput | SortOrder
    unsubscribeToken?: SortOrderInput | SortOrder
    confirmedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: SubscriberCountOrderByAggregateInput
    _max?: SubscriberMaxOrderByAggregateInput
    _min?: SubscriberMinOrderByAggregateInput
  }

  export type SubscriberScalarWhereWithAggregatesInput = {
    AND?: SubscriberScalarWhereWithAggregatesInput | SubscriberScalarWhereWithAggregatesInput[]
    OR?: SubscriberScalarWhereWithAggregatesInput[]
    NOT?: SubscriberScalarWhereWithAggregatesInput | SubscriberScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Subscriber"> | string
    email?: StringWithAggregatesFilter<"Subscriber"> | string
    status?: StringWithAggregatesFilter<"Subscriber"> | string
    confirmToken?: StringNullableWithAggregatesFilter<"Subscriber"> | string | null
    unsubscribeToken?: StringNullableWithAggregatesFilter<"Subscriber"> | string | null
    confirmedAt?: DateTimeNullableWithAggregatesFilter<"Subscriber"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Subscriber"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Subscriber"> | Date | string
  }

  export type PostWhereInput = {
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    id?: StringFilter<"Post"> | string
    title?: StringFilter<"Post"> | string
    slug?: StringFilter<"Post"> | string
    excerpt?: StringFilter<"Post"> | string
    content?: StringFilter<"Post"> | string
    category?: StringFilter<"Post"> | string
    tags?: JsonFilter<"Post">
    author?: StringFilter<"Post"> | string
    status?: StringFilter<"Post"> | string
    publishedAt?: DateTimeNullableFilter<"Post"> | Date | string | null
    notifySentAt?: DateTimeNullableFilter<"Post"> | Date | string | null
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
  }

  export type PostOrderByWithRelationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    excerpt?: SortOrder
    content?: SortOrder
    category?: SortOrder
    tags?: SortOrder
    author?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    notifySentAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    AND?: PostWhereInput | PostWhereInput[]
    OR?: PostWhereInput[]
    NOT?: PostWhereInput | PostWhereInput[]
    title?: StringFilter<"Post"> | string
    excerpt?: StringFilter<"Post"> | string
    content?: StringFilter<"Post"> | string
    category?: StringFilter<"Post"> | string
    tags?: JsonFilter<"Post">
    author?: StringFilter<"Post"> | string
    status?: StringFilter<"Post"> | string
    publishedAt?: DateTimeNullableFilter<"Post"> | Date | string | null
    notifySentAt?: DateTimeNullableFilter<"Post"> | Date | string | null
    createdAt?: DateTimeFilter<"Post"> | Date | string
    updatedAt?: DateTimeFilter<"Post"> | Date | string
  }, "id" | "slug">

  export type PostOrderByWithAggregationInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    excerpt?: SortOrder
    content?: SortOrder
    category?: SortOrder
    tags?: SortOrder
    author?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrderInput | SortOrder
    notifySentAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PostCountOrderByAggregateInput
    _max?: PostMaxOrderByAggregateInput
    _min?: PostMinOrderByAggregateInput
  }

  export type PostScalarWhereWithAggregatesInput = {
    AND?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    OR?: PostScalarWhereWithAggregatesInput[]
    NOT?: PostScalarWhereWithAggregatesInput | PostScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Post"> | string
    title?: StringWithAggregatesFilter<"Post"> | string
    slug?: StringWithAggregatesFilter<"Post"> | string
    excerpt?: StringWithAggregatesFilter<"Post"> | string
    content?: StringWithAggregatesFilter<"Post"> | string
    category?: StringWithAggregatesFilter<"Post"> | string
    tags?: JsonWithAggregatesFilter<"Post">
    author?: StringWithAggregatesFilter<"Post"> | string
    status?: StringWithAggregatesFilter<"Post"> | string
    publishedAt?: DateTimeNullableWithAggregatesFilter<"Post"> | Date | string | null
    notifySentAt?: DateTimeNullableWithAggregatesFilter<"Post"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Post"> | Date | string
  }

  export type TestimonialWhereInput = {
    AND?: TestimonialWhereInput | TestimonialWhereInput[]
    OR?: TestimonialWhereInput[]
    NOT?: TestimonialWhereInput | TestimonialWhereInput[]
    id?: StringFilter<"Testimonial"> | string
    name?: StringFilter<"Testimonial"> | string
    role?: StringFilter<"Testimonial"> | string
    service?: StringFilter<"Testimonial"> | string
    text?: StringFilter<"Testimonial"> | string
    rating?: IntFilter<"Testimonial"> | number
    avatar?: StringNullableFilter<"Testimonial"> | string | null
    status?: StringFilter<"Testimonial"> | string
    sortOrder?: IntFilter<"Testimonial"> | number
    createdAt?: DateTimeFilter<"Testimonial"> | Date | string
    updatedAt?: DateTimeFilter<"Testimonial"> | Date | string
  }

  export type TestimonialOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    role?: SortOrder
    service?: SortOrder
    text?: SortOrder
    rating?: SortOrder
    avatar?: SortOrderInput | SortOrder
    status?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TestimonialWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TestimonialWhereInput | TestimonialWhereInput[]
    OR?: TestimonialWhereInput[]
    NOT?: TestimonialWhereInput | TestimonialWhereInput[]
    name?: StringFilter<"Testimonial"> | string
    role?: StringFilter<"Testimonial"> | string
    service?: StringFilter<"Testimonial"> | string
    text?: StringFilter<"Testimonial"> | string
    rating?: IntFilter<"Testimonial"> | number
    avatar?: StringNullableFilter<"Testimonial"> | string | null
    status?: StringFilter<"Testimonial"> | string
    sortOrder?: IntFilter<"Testimonial"> | number
    createdAt?: DateTimeFilter<"Testimonial"> | Date | string
    updatedAt?: DateTimeFilter<"Testimonial"> | Date | string
  }, "id">

  export type TestimonialOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    role?: SortOrder
    service?: SortOrder
    text?: SortOrder
    rating?: SortOrder
    avatar?: SortOrderInput | SortOrder
    status?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: TestimonialCountOrderByAggregateInput
    _avg?: TestimonialAvgOrderByAggregateInput
    _max?: TestimonialMaxOrderByAggregateInput
    _min?: TestimonialMinOrderByAggregateInput
    _sum?: TestimonialSumOrderByAggregateInput
  }

  export type TestimonialScalarWhereWithAggregatesInput = {
    AND?: TestimonialScalarWhereWithAggregatesInput | TestimonialScalarWhereWithAggregatesInput[]
    OR?: TestimonialScalarWhereWithAggregatesInput[]
    NOT?: TestimonialScalarWhereWithAggregatesInput | TestimonialScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Testimonial"> | string
    name?: StringWithAggregatesFilter<"Testimonial"> | string
    role?: StringWithAggregatesFilter<"Testimonial"> | string
    service?: StringWithAggregatesFilter<"Testimonial"> | string
    text?: StringWithAggregatesFilter<"Testimonial"> | string
    rating?: IntWithAggregatesFilter<"Testimonial"> | number
    avatar?: StringNullableWithAggregatesFilter<"Testimonial"> | string | null
    status?: StringWithAggregatesFilter<"Testimonial"> | string
    sortOrder?: IntWithAggregatesFilter<"Testimonial"> | number
    createdAt?: DateTimeWithAggregatesFilter<"Testimonial"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Testimonial"> | Date | string
  }

  export type EmailLogWhereInput = {
    AND?: EmailLogWhereInput | EmailLogWhereInput[]
    OR?: EmailLogWhereInput[]
    NOT?: EmailLogWhereInput | EmailLogWhereInput[]
    id?: StringFilter<"EmailLog"> | string
    type?: StringFilter<"EmailLog"> | string
    recipientEmail?: StringFilter<"EmailLog"> | string
    subject?: StringFilter<"EmailLog"> | string
    postId?: StringNullableFilter<"EmailLog"> | string | null
    subscriberId?: StringNullableFilter<"EmailLog"> | string | null
    status?: StringFilter<"EmailLog"> | string
    error?: StringNullableFilter<"EmailLog"> | string | null
    sentAt?: DateTimeFilter<"EmailLog"> | Date | string
    bodyText?: StringNullableFilter<"EmailLog"> | string | null
    bodyHtml?: StringNullableFilter<"EmailLog"> | string | null
    attachments?: JsonFilter<"EmailLog">
    invoiceId?: StringNullableFilter<"EmailLog"> | string | null
    provider?: StringNullableFilter<"EmailLog"> | string | null
  }

  export type EmailLogOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    recipientEmail?: SortOrder
    subject?: SortOrder
    postId?: SortOrderInput | SortOrder
    subscriberId?: SortOrderInput | SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    sentAt?: SortOrder
    bodyText?: SortOrderInput | SortOrder
    bodyHtml?: SortOrderInput | SortOrder
    attachments?: SortOrder
    invoiceId?: SortOrderInput | SortOrder
    provider?: SortOrderInput | SortOrder
  }

  export type EmailLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: EmailLogWhereInput | EmailLogWhereInput[]
    OR?: EmailLogWhereInput[]
    NOT?: EmailLogWhereInput | EmailLogWhereInput[]
    type?: StringFilter<"EmailLog"> | string
    recipientEmail?: StringFilter<"EmailLog"> | string
    subject?: StringFilter<"EmailLog"> | string
    postId?: StringNullableFilter<"EmailLog"> | string | null
    subscriberId?: StringNullableFilter<"EmailLog"> | string | null
    status?: StringFilter<"EmailLog"> | string
    error?: StringNullableFilter<"EmailLog"> | string | null
    sentAt?: DateTimeFilter<"EmailLog"> | Date | string
    bodyText?: StringNullableFilter<"EmailLog"> | string | null
    bodyHtml?: StringNullableFilter<"EmailLog"> | string | null
    attachments?: JsonFilter<"EmailLog">
    invoiceId?: StringNullableFilter<"EmailLog"> | string | null
    provider?: StringNullableFilter<"EmailLog"> | string | null
  }, "id">

  export type EmailLogOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    recipientEmail?: SortOrder
    subject?: SortOrder
    postId?: SortOrderInput | SortOrder
    subscriberId?: SortOrderInput | SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    sentAt?: SortOrder
    bodyText?: SortOrderInput | SortOrder
    bodyHtml?: SortOrderInput | SortOrder
    attachments?: SortOrder
    invoiceId?: SortOrderInput | SortOrder
    provider?: SortOrderInput | SortOrder
    _count?: EmailLogCountOrderByAggregateInput
    _max?: EmailLogMaxOrderByAggregateInput
    _min?: EmailLogMinOrderByAggregateInput
  }

  export type EmailLogScalarWhereWithAggregatesInput = {
    AND?: EmailLogScalarWhereWithAggregatesInput | EmailLogScalarWhereWithAggregatesInput[]
    OR?: EmailLogScalarWhereWithAggregatesInput[]
    NOT?: EmailLogScalarWhereWithAggregatesInput | EmailLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EmailLog"> | string
    type?: StringWithAggregatesFilter<"EmailLog"> | string
    recipientEmail?: StringWithAggregatesFilter<"EmailLog"> | string
    subject?: StringWithAggregatesFilter<"EmailLog"> | string
    postId?: StringNullableWithAggregatesFilter<"EmailLog"> | string | null
    subscriberId?: StringNullableWithAggregatesFilter<"EmailLog"> | string | null
    status?: StringWithAggregatesFilter<"EmailLog"> | string
    error?: StringNullableWithAggregatesFilter<"EmailLog"> | string | null
    sentAt?: DateTimeWithAggregatesFilter<"EmailLog"> | Date | string
    bodyText?: StringNullableWithAggregatesFilter<"EmailLog"> | string | null
    bodyHtml?: StringNullableWithAggregatesFilter<"EmailLog"> | string | null
    attachments?: JsonWithAggregatesFilter<"EmailLog">
    invoiceId?: StringNullableWithAggregatesFilter<"EmailLog"> | string | null
    provider?: StringNullableWithAggregatesFilter<"EmailLog"> | string | null
  }

  export type EmailProviderConfigWhereInput = {
    AND?: EmailProviderConfigWhereInput | EmailProviderConfigWhereInput[]
    OR?: EmailProviderConfigWhereInput[]
    NOT?: EmailProviderConfigWhereInput | EmailProviderConfigWhereInput[]
    id?: StringFilter<"EmailProviderConfig"> | string
    provider?: StringFilter<"EmailProviderConfig"> | string
    displayName?: StringFilter<"EmailProviderConfig"> | string
    priority?: IntFilter<"EmailProviderConfig"> | number
    enabled?: BoolFilter<"EmailProviderConfig"> | boolean
    credentialsEnc?: StringFilter<"EmailProviderConfig"> | string
    lastTestAt?: DateTimeNullableFilter<"EmailProviderConfig"> | Date | string | null
    lastTestStatus?: StringNullableFilter<"EmailProviderConfig"> | string | null
    lastTestError?: StringNullableFilter<"EmailProviderConfig"> | string | null
    createdAt?: DateTimeFilter<"EmailProviderConfig"> | Date | string
    updatedAt?: DateTimeFilter<"EmailProviderConfig"> | Date | string
  }

  export type EmailProviderConfigOrderByWithRelationInput = {
    id?: SortOrder
    provider?: SortOrder
    displayName?: SortOrder
    priority?: SortOrder
    enabled?: SortOrder
    credentialsEnc?: SortOrder
    lastTestAt?: SortOrderInput | SortOrder
    lastTestStatus?: SortOrderInput | SortOrder
    lastTestError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EmailProviderConfigWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    provider?: string
    AND?: EmailProviderConfigWhereInput | EmailProviderConfigWhereInput[]
    OR?: EmailProviderConfigWhereInput[]
    NOT?: EmailProviderConfigWhereInput | EmailProviderConfigWhereInput[]
    displayName?: StringFilter<"EmailProviderConfig"> | string
    priority?: IntFilter<"EmailProviderConfig"> | number
    enabled?: BoolFilter<"EmailProviderConfig"> | boolean
    credentialsEnc?: StringFilter<"EmailProviderConfig"> | string
    lastTestAt?: DateTimeNullableFilter<"EmailProviderConfig"> | Date | string | null
    lastTestStatus?: StringNullableFilter<"EmailProviderConfig"> | string | null
    lastTestError?: StringNullableFilter<"EmailProviderConfig"> | string | null
    createdAt?: DateTimeFilter<"EmailProviderConfig"> | Date | string
    updatedAt?: DateTimeFilter<"EmailProviderConfig"> | Date | string
  }, "id" | "provider">

  export type EmailProviderConfigOrderByWithAggregationInput = {
    id?: SortOrder
    provider?: SortOrder
    displayName?: SortOrder
    priority?: SortOrder
    enabled?: SortOrder
    credentialsEnc?: SortOrder
    lastTestAt?: SortOrderInput | SortOrder
    lastTestStatus?: SortOrderInput | SortOrder
    lastTestError?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: EmailProviderConfigCountOrderByAggregateInput
    _avg?: EmailProviderConfigAvgOrderByAggregateInput
    _max?: EmailProviderConfigMaxOrderByAggregateInput
    _min?: EmailProviderConfigMinOrderByAggregateInput
    _sum?: EmailProviderConfigSumOrderByAggregateInput
  }

  export type EmailProviderConfigScalarWhereWithAggregatesInput = {
    AND?: EmailProviderConfigScalarWhereWithAggregatesInput | EmailProviderConfigScalarWhereWithAggregatesInput[]
    OR?: EmailProviderConfigScalarWhereWithAggregatesInput[]
    NOT?: EmailProviderConfigScalarWhereWithAggregatesInput | EmailProviderConfigScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EmailProviderConfig"> | string
    provider?: StringWithAggregatesFilter<"EmailProviderConfig"> | string
    displayName?: StringWithAggregatesFilter<"EmailProviderConfig"> | string
    priority?: IntWithAggregatesFilter<"EmailProviderConfig"> | number
    enabled?: BoolWithAggregatesFilter<"EmailProviderConfig"> | boolean
    credentialsEnc?: StringWithAggregatesFilter<"EmailProviderConfig"> | string
    lastTestAt?: DateTimeNullableWithAggregatesFilter<"EmailProviderConfig"> | Date | string | null
    lastTestStatus?: StringNullableWithAggregatesFilter<"EmailProviderConfig"> | string | null
    lastTestError?: StringNullableWithAggregatesFilter<"EmailProviderConfig"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"EmailProviderConfig"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"EmailProviderConfig"> | Date | string
  }

  export type ReceivedEmailWhereInput = {
    AND?: ReceivedEmailWhereInput | ReceivedEmailWhereInput[]
    OR?: ReceivedEmailWhereInput[]
    NOT?: ReceivedEmailWhereInput | ReceivedEmailWhereInput[]
    id?: StringFilter<"ReceivedEmail"> | string
    source?: StringFilter<"ReceivedEmail"> | string
    name?: StringNullableFilter<"ReceivedEmail"> | string | null
    email?: StringNullableFilter<"ReceivedEmail"> | string | null
    phone?: StringNullableFilter<"ReceivedEmail"> | string | null
    subject?: StringNullableFilter<"ReceivedEmail"> | string | null
    message?: StringFilter<"ReceivedEmail"> | string
    leadScore?: IntNullableFilter<"ReceivedEmail"> | number | null
    meta?: JsonFilter<"ReceivedEmail">
    inquiryId?: StringNullableFilter<"ReceivedEmail"> | string | null
    createdAt?: DateTimeFilter<"ReceivedEmail"> | Date | string
  }

  export type ReceivedEmailOrderByWithRelationInput = {
    id?: SortOrder
    source?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    subject?: SortOrderInput | SortOrder
    message?: SortOrder
    leadScore?: SortOrderInput | SortOrder
    meta?: SortOrder
    inquiryId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type ReceivedEmailWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: ReceivedEmailWhereInput | ReceivedEmailWhereInput[]
    OR?: ReceivedEmailWhereInput[]
    NOT?: ReceivedEmailWhereInput | ReceivedEmailWhereInput[]
    source?: StringFilter<"ReceivedEmail"> | string
    name?: StringNullableFilter<"ReceivedEmail"> | string | null
    email?: StringNullableFilter<"ReceivedEmail"> | string | null
    phone?: StringNullableFilter<"ReceivedEmail"> | string | null
    subject?: StringNullableFilter<"ReceivedEmail"> | string | null
    message?: StringFilter<"ReceivedEmail"> | string
    leadScore?: IntNullableFilter<"ReceivedEmail"> | number | null
    meta?: JsonFilter<"ReceivedEmail">
    inquiryId?: StringNullableFilter<"ReceivedEmail"> | string | null
    createdAt?: DateTimeFilter<"ReceivedEmail"> | Date | string
  }, "id">

  export type ReceivedEmailOrderByWithAggregationInput = {
    id?: SortOrder
    source?: SortOrder
    name?: SortOrderInput | SortOrder
    email?: SortOrderInput | SortOrder
    phone?: SortOrderInput | SortOrder
    subject?: SortOrderInput | SortOrder
    message?: SortOrder
    leadScore?: SortOrderInput | SortOrder
    meta?: SortOrder
    inquiryId?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ReceivedEmailCountOrderByAggregateInput
    _avg?: ReceivedEmailAvgOrderByAggregateInput
    _max?: ReceivedEmailMaxOrderByAggregateInput
    _min?: ReceivedEmailMinOrderByAggregateInput
    _sum?: ReceivedEmailSumOrderByAggregateInput
  }

  export type ReceivedEmailScalarWhereWithAggregatesInput = {
    AND?: ReceivedEmailScalarWhereWithAggregatesInput | ReceivedEmailScalarWhereWithAggregatesInput[]
    OR?: ReceivedEmailScalarWhereWithAggregatesInput[]
    NOT?: ReceivedEmailScalarWhereWithAggregatesInput | ReceivedEmailScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ReceivedEmail"> | string
    source?: StringWithAggregatesFilter<"ReceivedEmail"> | string
    name?: StringNullableWithAggregatesFilter<"ReceivedEmail"> | string | null
    email?: StringNullableWithAggregatesFilter<"ReceivedEmail"> | string | null
    phone?: StringNullableWithAggregatesFilter<"ReceivedEmail"> | string | null
    subject?: StringNullableWithAggregatesFilter<"ReceivedEmail"> | string | null
    message?: StringWithAggregatesFilter<"ReceivedEmail"> | string
    leadScore?: IntNullableWithAggregatesFilter<"ReceivedEmail"> | number | null
    meta?: JsonWithAggregatesFilter<"ReceivedEmail">
    inquiryId?: StringNullableWithAggregatesFilter<"ReceivedEmail"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ReceivedEmail"> | Date | string
  }

  export type InvoiceWhereInput = {
    AND?: InvoiceWhereInput | InvoiceWhereInput[]
    OR?: InvoiceWhereInput[]
    NOT?: InvoiceWhereInput | InvoiceWhereInput[]
    id?: StringFilter<"Invoice"> | string
    invoiceNumber?: StringFilter<"Invoice"> | string
    inquiryId?: StringNullableFilter<"Invoice"> | string | null
    customerName?: StringFilter<"Invoice"> | string
    customerEmail?: StringFilter<"Invoice"> | string
    customerPhone?: StringNullableFilter<"Invoice"> | string | null
    service?: StringFilter<"Invoice"> | string
    description?: StringNullableFilter<"Invoice"> | string | null
    proposalJson?: JsonNullableFilter<"Invoice">
    amountKobo?: IntFilter<"Invoice"> | number
    currency?: StringFilter<"Invoice"> | string
    durationLabel?: StringNullableFilter<"Invoice"> | string | null
    dueDate?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    status?: StringFilter<"Invoice"> | string
    dvaAccountNumber?: StringNullableFilter<"Invoice"> | string | null
    dvaBankName?: StringNullableFilter<"Invoice"> | string | null
    dvaBankCode?: StringNullableFilter<"Invoice"> | string | null
    paystackReference?: StringNullableFilter<"Invoice"> | string | null
    pdfUrl?: StringNullableFilter<"Invoice"> | string | null
    pdfStorage?: StringNullableFilter<"Invoice"> | string | null
    secureToken?: StringNullableFilter<"Invoice"> | string | null
    portalViewedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    paymentProofUrl?: StringNullableFilter<"Invoice"> | string | null
    paymentProofName?: StringNullableFilter<"Invoice"> | string | null
    paymentProofUploadedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    paidAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    sentAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    createdAt?: DateTimeFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeFilter<"Invoice"> | Date | string
  }

  export type InvoiceOrderByWithRelationInput = {
    id?: SortOrder
    invoiceNumber?: SortOrder
    inquiryId?: SortOrderInput | SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    customerPhone?: SortOrderInput | SortOrder
    service?: SortOrder
    description?: SortOrderInput | SortOrder
    proposalJson?: SortOrderInput | SortOrder
    amountKobo?: SortOrder
    currency?: SortOrder
    durationLabel?: SortOrderInput | SortOrder
    dueDate?: SortOrderInput | SortOrder
    status?: SortOrder
    dvaAccountNumber?: SortOrderInput | SortOrder
    dvaBankName?: SortOrderInput | SortOrder
    dvaBankCode?: SortOrderInput | SortOrder
    paystackReference?: SortOrderInput | SortOrder
    pdfUrl?: SortOrderInput | SortOrder
    pdfStorage?: SortOrderInput | SortOrder
    secureToken?: SortOrderInput | SortOrder
    portalViewedAt?: SortOrderInput | SortOrder
    paymentProofUrl?: SortOrderInput | SortOrder
    paymentProofName?: SortOrderInput | SortOrder
    paymentProofUploadedAt?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    sentAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    invoiceNumber?: string
    paystackReference?: string
    secureToken?: string
    AND?: InvoiceWhereInput | InvoiceWhereInput[]
    OR?: InvoiceWhereInput[]
    NOT?: InvoiceWhereInput | InvoiceWhereInput[]
    inquiryId?: StringNullableFilter<"Invoice"> | string | null
    customerName?: StringFilter<"Invoice"> | string
    customerEmail?: StringFilter<"Invoice"> | string
    customerPhone?: StringNullableFilter<"Invoice"> | string | null
    service?: StringFilter<"Invoice"> | string
    description?: StringNullableFilter<"Invoice"> | string | null
    proposalJson?: JsonNullableFilter<"Invoice">
    amountKobo?: IntFilter<"Invoice"> | number
    currency?: StringFilter<"Invoice"> | string
    durationLabel?: StringNullableFilter<"Invoice"> | string | null
    dueDate?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    status?: StringFilter<"Invoice"> | string
    dvaAccountNumber?: StringNullableFilter<"Invoice"> | string | null
    dvaBankName?: StringNullableFilter<"Invoice"> | string | null
    dvaBankCode?: StringNullableFilter<"Invoice"> | string | null
    pdfUrl?: StringNullableFilter<"Invoice"> | string | null
    pdfStorage?: StringNullableFilter<"Invoice"> | string | null
    portalViewedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    paymentProofUrl?: StringNullableFilter<"Invoice"> | string | null
    paymentProofName?: StringNullableFilter<"Invoice"> | string | null
    paymentProofUploadedAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    paidAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    sentAt?: DateTimeNullableFilter<"Invoice"> | Date | string | null
    createdAt?: DateTimeFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeFilter<"Invoice"> | Date | string
  }, "id" | "invoiceNumber" | "paystackReference" | "secureToken">

  export type InvoiceOrderByWithAggregationInput = {
    id?: SortOrder
    invoiceNumber?: SortOrder
    inquiryId?: SortOrderInput | SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    customerPhone?: SortOrderInput | SortOrder
    service?: SortOrder
    description?: SortOrderInput | SortOrder
    proposalJson?: SortOrderInput | SortOrder
    amountKobo?: SortOrder
    currency?: SortOrder
    durationLabel?: SortOrderInput | SortOrder
    dueDate?: SortOrderInput | SortOrder
    status?: SortOrder
    dvaAccountNumber?: SortOrderInput | SortOrder
    dvaBankName?: SortOrderInput | SortOrder
    dvaBankCode?: SortOrderInput | SortOrder
    paystackReference?: SortOrderInput | SortOrder
    pdfUrl?: SortOrderInput | SortOrder
    pdfStorage?: SortOrderInput | SortOrder
    secureToken?: SortOrderInput | SortOrder
    portalViewedAt?: SortOrderInput | SortOrder
    paymentProofUrl?: SortOrderInput | SortOrder
    paymentProofName?: SortOrderInput | SortOrder
    paymentProofUploadedAt?: SortOrderInput | SortOrder
    paidAt?: SortOrderInput | SortOrder
    sentAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: InvoiceCountOrderByAggregateInput
    _avg?: InvoiceAvgOrderByAggregateInput
    _max?: InvoiceMaxOrderByAggregateInput
    _min?: InvoiceMinOrderByAggregateInput
    _sum?: InvoiceSumOrderByAggregateInput
  }

  export type InvoiceScalarWhereWithAggregatesInput = {
    AND?: InvoiceScalarWhereWithAggregatesInput | InvoiceScalarWhereWithAggregatesInput[]
    OR?: InvoiceScalarWhereWithAggregatesInput[]
    NOT?: InvoiceScalarWhereWithAggregatesInput | InvoiceScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Invoice"> | string
    invoiceNumber?: StringWithAggregatesFilter<"Invoice"> | string
    inquiryId?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    customerName?: StringWithAggregatesFilter<"Invoice"> | string
    customerEmail?: StringWithAggregatesFilter<"Invoice"> | string
    customerPhone?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    service?: StringWithAggregatesFilter<"Invoice"> | string
    description?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    proposalJson?: JsonNullableWithAggregatesFilter<"Invoice">
    amountKobo?: IntWithAggregatesFilter<"Invoice"> | number
    currency?: StringWithAggregatesFilter<"Invoice"> | string
    durationLabel?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    dueDate?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    status?: StringWithAggregatesFilter<"Invoice"> | string
    dvaAccountNumber?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    dvaBankName?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    dvaBankCode?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    paystackReference?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    pdfUrl?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    pdfStorage?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    secureToken?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    portalViewedAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    paymentProofUrl?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    paymentProofName?: StringNullableWithAggregatesFilter<"Invoice"> | string | null
    paymentProofUploadedAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    paidAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    sentAt?: DateTimeNullableWithAggregatesFilter<"Invoice"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Invoice"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Invoice"> | Date | string
  }

  export type EventRecordWhereInput = {
    AND?: EventRecordWhereInput | EventRecordWhereInput[]
    OR?: EventRecordWhereInput[]
    NOT?: EventRecordWhereInput | EventRecordWhereInput[]
    id?: StringFilter<"EventRecord"> | string
    type?: StringFilter<"EventRecord"> | string
    customerEmail?: StringNullableFilter<"EventRecord"> | string | null
    customerPhone?: StringNullableFilter<"EventRecord"> | string | null
    eventDate?: DateTimeFilter<"EventRecord"> | Date | string
    relatedInvoiceId?: StringNullableFilter<"EventRecord"> | string | null
    payload?: JsonFilter<"EventRecord">
    status?: StringFilter<"EventRecord"> | string
    processedAt?: DateTimeNullableFilter<"EventRecord"> | Date | string | null
    lastSentAt?: DateTimeNullableFilter<"EventRecord"> | Date | string | null
    createdAt?: DateTimeFilter<"EventRecord"> | Date | string
  }

  export type EventRecordOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    customerEmail?: SortOrderInput | SortOrder
    customerPhone?: SortOrderInput | SortOrder
    eventDate?: SortOrder
    relatedInvoiceId?: SortOrderInput | SortOrder
    payload?: SortOrder
    status?: SortOrder
    processedAt?: SortOrderInput | SortOrder
    lastSentAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type EventRecordWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: EventRecordWhereInput | EventRecordWhereInput[]
    OR?: EventRecordWhereInput[]
    NOT?: EventRecordWhereInput | EventRecordWhereInput[]
    type?: StringFilter<"EventRecord"> | string
    customerEmail?: StringNullableFilter<"EventRecord"> | string | null
    customerPhone?: StringNullableFilter<"EventRecord"> | string | null
    eventDate?: DateTimeFilter<"EventRecord"> | Date | string
    relatedInvoiceId?: StringNullableFilter<"EventRecord"> | string | null
    payload?: JsonFilter<"EventRecord">
    status?: StringFilter<"EventRecord"> | string
    processedAt?: DateTimeNullableFilter<"EventRecord"> | Date | string | null
    lastSentAt?: DateTimeNullableFilter<"EventRecord"> | Date | string | null
    createdAt?: DateTimeFilter<"EventRecord"> | Date | string
  }, "id">

  export type EventRecordOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    customerEmail?: SortOrderInput | SortOrder
    customerPhone?: SortOrderInput | SortOrder
    eventDate?: SortOrder
    relatedInvoiceId?: SortOrderInput | SortOrder
    payload?: SortOrder
    status?: SortOrder
    processedAt?: SortOrderInput | SortOrder
    lastSentAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: EventRecordCountOrderByAggregateInput
    _max?: EventRecordMaxOrderByAggregateInput
    _min?: EventRecordMinOrderByAggregateInput
  }

  export type EventRecordScalarWhereWithAggregatesInput = {
    AND?: EventRecordScalarWhereWithAggregatesInput | EventRecordScalarWhereWithAggregatesInput[]
    OR?: EventRecordScalarWhereWithAggregatesInput[]
    NOT?: EventRecordScalarWhereWithAggregatesInput | EventRecordScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EventRecord"> | string
    type?: StringWithAggregatesFilter<"EventRecord"> | string
    customerEmail?: StringNullableWithAggregatesFilter<"EventRecord"> | string | null
    customerPhone?: StringNullableWithAggregatesFilter<"EventRecord"> | string | null
    eventDate?: DateTimeWithAggregatesFilter<"EventRecord"> | Date | string
    relatedInvoiceId?: StringNullableWithAggregatesFilter<"EventRecord"> | string | null
    payload?: JsonWithAggregatesFilter<"EventRecord">
    status?: StringWithAggregatesFilter<"EventRecord"> | string
    processedAt?: DateTimeNullableWithAggregatesFilter<"EventRecord"> | Date | string | null
    lastSentAt?: DateTimeNullableWithAggregatesFilter<"EventRecord"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"EventRecord"> | Date | string
  }

  export type WhatsAppMessageWhereInput = {
    AND?: WhatsAppMessageWhereInput | WhatsAppMessageWhereInput[]
    OR?: WhatsAppMessageWhereInput[]
    NOT?: WhatsAppMessageWhereInput | WhatsAppMessageWhereInput[]
    id?: StringFilter<"WhatsAppMessage"> | string
    direction?: StringFilter<"WhatsAppMessage"> | string
    toPhone?: StringNullableFilter<"WhatsAppMessage"> | string | null
    fromPhone?: StringNullableFilter<"WhatsAppMessage"> | string | null
    messageText?: StringNullableFilter<"WhatsAppMessage"> | string | null
    mediaUrl?: StringNullableFilter<"WhatsAppMessage"> | string | null
    mediaFilename?: StringNullableFilter<"WhatsAppMessage"> | string | null
    relatedInvoiceId?: StringNullableFilter<"WhatsAppMessage"> | string | null
    status?: StringFilter<"WhatsAppMessage"> | string
    sentAt?: DateTimeFilter<"WhatsAppMessage"> | Date | string
  }

  export type WhatsAppMessageOrderByWithRelationInput = {
    id?: SortOrder
    direction?: SortOrder
    toPhone?: SortOrderInput | SortOrder
    fromPhone?: SortOrderInput | SortOrder
    messageText?: SortOrderInput | SortOrder
    mediaUrl?: SortOrderInput | SortOrder
    mediaFilename?: SortOrderInput | SortOrder
    relatedInvoiceId?: SortOrderInput | SortOrder
    status?: SortOrder
    sentAt?: SortOrder
  }

  export type WhatsAppMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: WhatsAppMessageWhereInput | WhatsAppMessageWhereInput[]
    OR?: WhatsAppMessageWhereInput[]
    NOT?: WhatsAppMessageWhereInput | WhatsAppMessageWhereInput[]
    direction?: StringFilter<"WhatsAppMessage"> | string
    toPhone?: StringNullableFilter<"WhatsAppMessage"> | string | null
    fromPhone?: StringNullableFilter<"WhatsAppMessage"> | string | null
    messageText?: StringNullableFilter<"WhatsAppMessage"> | string | null
    mediaUrl?: StringNullableFilter<"WhatsAppMessage"> | string | null
    mediaFilename?: StringNullableFilter<"WhatsAppMessage"> | string | null
    relatedInvoiceId?: StringNullableFilter<"WhatsAppMessage"> | string | null
    status?: StringFilter<"WhatsAppMessage"> | string
    sentAt?: DateTimeFilter<"WhatsAppMessage"> | Date | string
  }, "id">

  export type WhatsAppMessageOrderByWithAggregationInput = {
    id?: SortOrder
    direction?: SortOrder
    toPhone?: SortOrderInput | SortOrder
    fromPhone?: SortOrderInput | SortOrder
    messageText?: SortOrderInput | SortOrder
    mediaUrl?: SortOrderInput | SortOrder
    mediaFilename?: SortOrderInput | SortOrder
    relatedInvoiceId?: SortOrderInput | SortOrder
    status?: SortOrder
    sentAt?: SortOrder
    _count?: WhatsAppMessageCountOrderByAggregateInput
    _max?: WhatsAppMessageMaxOrderByAggregateInput
    _min?: WhatsAppMessageMinOrderByAggregateInput
  }

  export type WhatsAppMessageScalarWhereWithAggregatesInput = {
    AND?: WhatsAppMessageScalarWhereWithAggregatesInput | WhatsAppMessageScalarWhereWithAggregatesInput[]
    OR?: WhatsAppMessageScalarWhereWithAggregatesInput[]
    NOT?: WhatsAppMessageScalarWhereWithAggregatesInput | WhatsAppMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"WhatsAppMessage"> | string
    direction?: StringWithAggregatesFilter<"WhatsAppMessage"> | string
    toPhone?: StringNullableWithAggregatesFilter<"WhatsAppMessage"> | string | null
    fromPhone?: StringNullableWithAggregatesFilter<"WhatsAppMessage"> | string | null
    messageText?: StringNullableWithAggregatesFilter<"WhatsAppMessage"> | string | null
    mediaUrl?: StringNullableWithAggregatesFilter<"WhatsAppMessage"> | string | null
    mediaFilename?: StringNullableWithAggregatesFilter<"WhatsAppMessage"> | string | null
    relatedInvoiceId?: StringNullableWithAggregatesFilter<"WhatsAppMessage"> | string | null
    status?: StringWithAggregatesFilter<"WhatsAppMessage"> | string
    sentAt?: DateTimeWithAggregatesFilter<"WhatsAppMessage"> | Date | string
  }

  export type AnalyticsEventWhereInput = {
    AND?: AnalyticsEventWhereInput | AnalyticsEventWhereInput[]
    OR?: AnalyticsEventWhereInput[]
    NOT?: AnalyticsEventWhereInput | AnalyticsEventWhereInput[]
    id?: StringFilter<"AnalyticsEvent"> | string
    type?: StringFilter<"AnalyticsEvent"> | string
    invoiceId?: StringNullableFilter<"AnalyticsEvent"> | string | null
    secureToken?: StringNullableFilter<"AnalyticsEvent"> | string | null
    sessionId?: StringNullableFilter<"AnalyticsEvent"> | string | null
    meta?: JsonFilter<"AnalyticsEvent">
    createdAt?: DateTimeFilter<"AnalyticsEvent"> | Date | string
  }

  export type AnalyticsEventOrderByWithRelationInput = {
    id?: SortOrder
    type?: SortOrder
    invoiceId?: SortOrderInput | SortOrder
    secureToken?: SortOrderInput | SortOrder
    sessionId?: SortOrderInput | SortOrder
    meta?: SortOrder
    createdAt?: SortOrder
  }

  export type AnalyticsEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: AnalyticsEventWhereInput | AnalyticsEventWhereInput[]
    OR?: AnalyticsEventWhereInput[]
    NOT?: AnalyticsEventWhereInput | AnalyticsEventWhereInput[]
    type?: StringFilter<"AnalyticsEvent"> | string
    invoiceId?: StringNullableFilter<"AnalyticsEvent"> | string | null
    secureToken?: StringNullableFilter<"AnalyticsEvent"> | string | null
    sessionId?: StringNullableFilter<"AnalyticsEvent"> | string | null
    meta?: JsonFilter<"AnalyticsEvent">
    createdAt?: DateTimeFilter<"AnalyticsEvent"> | Date | string
  }, "id">

  export type AnalyticsEventOrderByWithAggregationInput = {
    id?: SortOrder
    type?: SortOrder
    invoiceId?: SortOrderInput | SortOrder
    secureToken?: SortOrderInput | SortOrder
    sessionId?: SortOrderInput | SortOrder
    meta?: SortOrder
    createdAt?: SortOrder
    _count?: AnalyticsEventCountOrderByAggregateInput
    _max?: AnalyticsEventMaxOrderByAggregateInput
    _min?: AnalyticsEventMinOrderByAggregateInput
  }

  export type AnalyticsEventScalarWhereWithAggregatesInput = {
    AND?: AnalyticsEventScalarWhereWithAggregatesInput | AnalyticsEventScalarWhereWithAggregatesInput[]
    OR?: AnalyticsEventScalarWhereWithAggregatesInput[]
    NOT?: AnalyticsEventScalarWhereWithAggregatesInput | AnalyticsEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"AnalyticsEvent"> | string
    type?: StringWithAggregatesFilter<"AnalyticsEvent"> | string
    invoiceId?: StringNullableWithAggregatesFilter<"AnalyticsEvent"> | string | null
    secureToken?: StringNullableWithAggregatesFilter<"AnalyticsEvent"> | string | null
    sessionId?: StringNullableWithAggregatesFilter<"AnalyticsEvent"> | string | null
    meta?: JsonWithAggregatesFilter<"AnalyticsEvent">
    createdAt?: DateTimeWithAggregatesFilter<"AnalyticsEvent"> | Date | string
  }

  export type BackupLogWhereInput = {
    AND?: BackupLogWhereInput | BackupLogWhereInput[]
    OR?: BackupLogWhereInput[]
    NOT?: BackupLogWhereInput | BackupLogWhereInput[]
    id?: StringFilter<"BackupLog"> | string
    kind?: StringFilter<"BackupLog"> | string
    target?: StringFilter<"BackupLog"> | string
    status?: StringFilter<"BackupLog"> | string
    fileName?: StringNullableFilter<"BackupLog"> | string | null
    sizeBytes?: IntNullableFilter<"BackupLog"> | number | null
    durationMs?: IntNullableFilter<"BackupLog"> | number | null
    error?: StringNullableFilter<"BackupLog"> | string | null
    createdAt?: DateTimeFilter<"BackupLog"> | Date | string
  }

  export type BackupLogOrderByWithRelationInput = {
    id?: SortOrder
    kind?: SortOrder
    target?: SortOrder
    status?: SortOrder
    fileName?: SortOrderInput | SortOrder
    sizeBytes?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type BackupLogWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: BackupLogWhereInput | BackupLogWhereInput[]
    OR?: BackupLogWhereInput[]
    NOT?: BackupLogWhereInput | BackupLogWhereInput[]
    kind?: StringFilter<"BackupLog"> | string
    target?: StringFilter<"BackupLog"> | string
    status?: StringFilter<"BackupLog"> | string
    fileName?: StringNullableFilter<"BackupLog"> | string | null
    sizeBytes?: IntNullableFilter<"BackupLog"> | number | null
    durationMs?: IntNullableFilter<"BackupLog"> | number | null
    error?: StringNullableFilter<"BackupLog"> | string | null
    createdAt?: DateTimeFilter<"BackupLog"> | Date | string
  }, "id">

  export type BackupLogOrderByWithAggregationInput = {
    id?: SortOrder
    kind?: SortOrder
    target?: SortOrder
    status?: SortOrder
    fileName?: SortOrderInput | SortOrder
    sizeBytes?: SortOrderInput | SortOrder
    durationMs?: SortOrderInput | SortOrder
    error?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: BackupLogCountOrderByAggregateInput
    _avg?: BackupLogAvgOrderByAggregateInput
    _max?: BackupLogMaxOrderByAggregateInput
    _min?: BackupLogMinOrderByAggregateInput
    _sum?: BackupLogSumOrderByAggregateInput
  }

  export type BackupLogScalarWhereWithAggregatesInput = {
    AND?: BackupLogScalarWhereWithAggregatesInput | BackupLogScalarWhereWithAggregatesInput[]
    OR?: BackupLogScalarWhereWithAggregatesInput[]
    NOT?: BackupLogScalarWhereWithAggregatesInput | BackupLogScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"BackupLog"> | string
    kind?: StringWithAggregatesFilter<"BackupLog"> | string
    target?: StringWithAggregatesFilter<"BackupLog"> | string
    status?: StringWithAggregatesFilter<"BackupLog"> | string
    fileName?: StringNullableWithAggregatesFilter<"BackupLog"> | string | null
    sizeBytes?: IntNullableWithAggregatesFilter<"BackupLog"> | number | null
    durationMs?: IntNullableWithAggregatesFilter<"BackupLog"> | number | null
    error?: StringNullableWithAggregatesFilter<"BackupLog"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"BackupLog"> | Date | string
  }

  export type CustomerWhereInput = {
    AND?: CustomerWhereInput | CustomerWhereInput[]
    OR?: CustomerWhereInput[]
    NOT?: CustomerWhereInput | CustomerWhereInput[]
    id?: StringFilter<"Customer"> | string
    name?: StringFilter<"Customer"> | string
    email?: StringFilter<"Customer"> | string
    phone?: StringNullableFilter<"Customer"> | string | null
    whatsapp?: StringNullableFilter<"Customer"> | string | null
    company?: StringNullableFilter<"Customer"> | string | null
    role?: StringNullableFilter<"Customer"> | string | null
    status?: StringFilter<"Customer"> | string
    tags?: JsonFilter<"Customer">
    notes?: StringNullableFilter<"Customer"> | string | null
    source?: StringFilter<"Customer"> | string
    leadScore?: IntNullableFilter<"Customer"> | number | null
    createdAt?: DateTimeFilter<"Customer"> | Date | string
    updatedAt?: DateTimeFilter<"Customer"> | Date | string
    lastContactAt?: DateTimeNullableFilter<"Customer"> | Date | string | null
  }

  export type CustomerOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    whatsapp?: SortOrderInput | SortOrder
    company?: SortOrderInput | SortOrder
    role?: SortOrderInput | SortOrder
    status?: SortOrder
    tags?: SortOrder
    notes?: SortOrderInput | SortOrder
    source?: SortOrder
    leadScore?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastContactAt?: SortOrderInput | SortOrder
  }

  export type CustomerWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: CustomerWhereInput | CustomerWhereInput[]
    OR?: CustomerWhereInput[]
    NOT?: CustomerWhereInput | CustomerWhereInput[]
    name?: StringFilter<"Customer"> | string
    phone?: StringNullableFilter<"Customer"> | string | null
    whatsapp?: StringNullableFilter<"Customer"> | string | null
    company?: StringNullableFilter<"Customer"> | string | null
    role?: StringNullableFilter<"Customer"> | string | null
    status?: StringFilter<"Customer"> | string
    tags?: JsonFilter<"Customer">
    notes?: StringNullableFilter<"Customer"> | string | null
    source?: StringFilter<"Customer"> | string
    leadScore?: IntNullableFilter<"Customer"> | number | null
    createdAt?: DateTimeFilter<"Customer"> | Date | string
    updatedAt?: DateTimeFilter<"Customer"> | Date | string
    lastContactAt?: DateTimeNullableFilter<"Customer"> | Date | string | null
  }, "id" | "email">

  export type CustomerOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrderInput | SortOrder
    whatsapp?: SortOrderInput | SortOrder
    company?: SortOrderInput | SortOrder
    role?: SortOrderInput | SortOrder
    status?: SortOrder
    tags?: SortOrder
    notes?: SortOrderInput | SortOrder
    source?: SortOrder
    leadScore?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastContactAt?: SortOrderInput | SortOrder
    _count?: CustomerCountOrderByAggregateInput
    _avg?: CustomerAvgOrderByAggregateInput
    _max?: CustomerMaxOrderByAggregateInput
    _min?: CustomerMinOrderByAggregateInput
    _sum?: CustomerSumOrderByAggregateInput
  }

  export type CustomerScalarWhereWithAggregatesInput = {
    AND?: CustomerScalarWhereWithAggregatesInput | CustomerScalarWhereWithAggregatesInput[]
    OR?: CustomerScalarWhereWithAggregatesInput[]
    NOT?: CustomerScalarWhereWithAggregatesInput | CustomerScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Customer"> | string
    name?: StringWithAggregatesFilter<"Customer"> | string
    email?: StringWithAggregatesFilter<"Customer"> | string
    phone?: StringNullableWithAggregatesFilter<"Customer"> | string | null
    whatsapp?: StringNullableWithAggregatesFilter<"Customer"> | string | null
    company?: StringNullableWithAggregatesFilter<"Customer"> | string | null
    role?: StringNullableWithAggregatesFilter<"Customer"> | string | null
    status?: StringWithAggregatesFilter<"Customer"> | string
    tags?: JsonWithAggregatesFilter<"Customer">
    notes?: StringNullableWithAggregatesFilter<"Customer"> | string | null
    source?: StringWithAggregatesFilter<"Customer"> | string
    leadScore?: IntNullableWithAggregatesFilter<"Customer"> | number | null
    createdAt?: DateTimeWithAggregatesFilter<"Customer"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Customer"> | Date | string
    lastContactAt?: DateTimeNullableWithAggregatesFilter<"Customer"> | Date | string | null
  }

  export type CustomerNoteWhereInput = {
    AND?: CustomerNoteWhereInput | CustomerNoteWhereInput[]
    OR?: CustomerNoteWhereInput[]
    NOT?: CustomerNoteWhereInput | CustomerNoteWhereInput[]
    id?: StringFilter<"CustomerNote"> | string
    customerId?: StringFilter<"CustomerNote"> | string
    author?: StringFilter<"CustomerNote"> | string
    body?: StringFilter<"CustomerNote"> | string
    context?: StringNullableFilter<"CustomerNote"> | string | null
    createdAt?: DateTimeFilter<"CustomerNote"> | Date | string
  }

  export type CustomerNoteOrderByWithRelationInput = {
    id?: SortOrder
    customerId?: SortOrder
    author?: SortOrder
    body?: SortOrder
    context?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type CustomerNoteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CustomerNoteWhereInput | CustomerNoteWhereInput[]
    OR?: CustomerNoteWhereInput[]
    NOT?: CustomerNoteWhereInput | CustomerNoteWhereInput[]
    customerId?: StringFilter<"CustomerNote"> | string
    author?: StringFilter<"CustomerNote"> | string
    body?: StringFilter<"CustomerNote"> | string
    context?: StringNullableFilter<"CustomerNote"> | string | null
    createdAt?: DateTimeFilter<"CustomerNote"> | Date | string
  }, "id">

  export type CustomerNoteOrderByWithAggregationInput = {
    id?: SortOrder
    customerId?: SortOrder
    author?: SortOrder
    body?: SortOrder
    context?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: CustomerNoteCountOrderByAggregateInput
    _max?: CustomerNoteMaxOrderByAggregateInput
    _min?: CustomerNoteMinOrderByAggregateInput
  }

  export type CustomerNoteScalarWhereWithAggregatesInput = {
    AND?: CustomerNoteScalarWhereWithAggregatesInput | CustomerNoteScalarWhereWithAggregatesInput[]
    OR?: CustomerNoteScalarWhereWithAggregatesInput[]
    NOT?: CustomerNoteScalarWhereWithAggregatesInput | CustomerNoteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CustomerNote"> | string
    customerId?: StringWithAggregatesFilter<"CustomerNote"> | string
    author?: StringWithAggregatesFilter<"CustomerNote"> | string
    body?: StringWithAggregatesFilter<"CustomerNote"> | string
    context?: StringNullableWithAggregatesFilter<"CustomerNote"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"CustomerNote"> | Date | string
  }

  export type CustomerMessageWhereInput = {
    AND?: CustomerMessageWhereInput | CustomerMessageWhereInput[]
    OR?: CustomerMessageWhereInput[]
    NOT?: CustomerMessageWhereInput | CustomerMessageWhereInput[]
    id?: StringFilter<"CustomerMessage"> | string
    customerId?: StringNullableFilter<"CustomerMessage"> | string | null
    toEmail?: StringFilter<"CustomerMessage"> | string
    toPhone?: StringNullableFilter<"CustomerMessage"> | string | null
    channel?: StringFilter<"CustomerMessage"> | string
    subject?: StringNullableFilter<"CustomerMessage"> | string | null
    body?: StringFilter<"CustomerMessage"> | string
    status?: StringFilter<"CustomerMessage"> | string
    error?: StringNullableFilter<"CustomerMessage"> | string | null
    sentAt?: DateTimeFilter<"CustomerMessage"> | Date | string
  }

  export type CustomerMessageOrderByWithRelationInput = {
    id?: SortOrder
    customerId?: SortOrderInput | SortOrder
    toEmail?: SortOrder
    toPhone?: SortOrderInput | SortOrder
    channel?: SortOrder
    subject?: SortOrderInput | SortOrder
    body?: SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    sentAt?: SortOrder
  }

  export type CustomerMessageWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: CustomerMessageWhereInput | CustomerMessageWhereInput[]
    OR?: CustomerMessageWhereInput[]
    NOT?: CustomerMessageWhereInput | CustomerMessageWhereInput[]
    customerId?: StringNullableFilter<"CustomerMessage"> | string | null
    toEmail?: StringFilter<"CustomerMessage"> | string
    toPhone?: StringNullableFilter<"CustomerMessage"> | string | null
    channel?: StringFilter<"CustomerMessage"> | string
    subject?: StringNullableFilter<"CustomerMessage"> | string | null
    body?: StringFilter<"CustomerMessage"> | string
    status?: StringFilter<"CustomerMessage"> | string
    error?: StringNullableFilter<"CustomerMessage"> | string | null
    sentAt?: DateTimeFilter<"CustomerMessage"> | Date | string
  }, "id">

  export type CustomerMessageOrderByWithAggregationInput = {
    id?: SortOrder
    customerId?: SortOrderInput | SortOrder
    toEmail?: SortOrder
    toPhone?: SortOrderInput | SortOrder
    channel?: SortOrder
    subject?: SortOrderInput | SortOrder
    body?: SortOrder
    status?: SortOrder
    error?: SortOrderInput | SortOrder
    sentAt?: SortOrder
    _count?: CustomerMessageCountOrderByAggregateInput
    _max?: CustomerMessageMaxOrderByAggregateInput
    _min?: CustomerMessageMinOrderByAggregateInput
  }

  export type CustomerMessageScalarWhereWithAggregatesInput = {
    AND?: CustomerMessageScalarWhereWithAggregatesInput | CustomerMessageScalarWhereWithAggregatesInput[]
    OR?: CustomerMessageScalarWhereWithAggregatesInput[]
    NOT?: CustomerMessageScalarWhereWithAggregatesInput | CustomerMessageScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"CustomerMessage"> | string
    customerId?: StringNullableWithAggregatesFilter<"CustomerMessage"> | string | null
    toEmail?: StringWithAggregatesFilter<"CustomerMessage"> | string
    toPhone?: StringNullableWithAggregatesFilter<"CustomerMessage"> | string | null
    channel?: StringWithAggregatesFilter<"CustomerMessage"> | string
    subject?: StringNullableWithAggregatesFilter<"CustomerMessage"> | string | null
    body?: StringWithAggregatesFilter<"CustomerMessage"> | string
    status?: StringWithAggregatesFilter<"CustomerMessage"> | string
    error?: StringNullableWithAggregatesFilter<"CustomerMessage"> | string | null
    sentAt?: DateTimeWithAggregatesFilter<"CustomerMessage"> | Date | string
  }

  export type InquiryCreateInput = {
    id?: string
    name: string
    email: string
    phone?: string | null
    whatsapp?: string | null
    service: string
    addlService?: string | null
    budget?: string | null
    message: string
    status?: string
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InquiryUncheckedCreateInput = {
    id?: string
    name: string
    email: string
    phone?: string | null
    whatsapp?: string | null
    service: string
    addlService?: string | null
    budget?: string | null
    message: string
    status?: string
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InquiryUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    whatsapp?: NullableStringFieldUpdateOperationsInput | string | null
    service?: StringFieldUpdateOperationsInput | string
    addlService?: NullableStringFieldUpdateOperationsInput | string | null
    budget?: NullableStringFieldUpdateOperationsInput | string | null
    message?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InquiryUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    whatsapp?: NullableStringFieldUpdateOperationsInput | string | null
    service?: StringFieldUpdateOperationsInput | string
    addlService?: NullableStringFieldUpdateOperationsInput | string | null
    budget?: NullableStringFieldUpdateOperationsInput | string | null
    message?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InquiryCreateManyInput = {
    id?: string
    name: string
    email: string
    phone?: string | null
    whatsapp?: string | null
    service: string
    addlService?: string | null
    budget?: string | null
    message: string
    status?: string
    source?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InquiryUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    whatsapp?: NullableStringFieldUpdateOperationsInput | string | null
    service?: StringFieldUpdateOperationsInput | string
    addlService?: NullableStringFieldUpdateOperationsInput | string | null
    budget?: NullableStringFieldUpdateOperationsInput | string | null
    message?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InquiryUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    whatsapp?: NullableStringFieldUpdateOperationsInput | string | null
    service?: StringFieldUpdateOperationsInput | string
    addlService?: NullableStringFieldUpdateOperationsInput | string | null
    budget?: NullableStringFieldUpdateOperationsInput | string | null
    message?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DraftProposalCreateInput = {
    id?: string
    source?: string
    customerName: string
    customerEmail: string
    service: string
    draftJson: JsonNullValueInput | InputJsonValue
    leadScore?: number | null
    inquiryId?: string | null
    receivedEmailId?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DraftProposalUncheckedCreateInput = {
    id?: string
    source?: string
    customerName: string
    customerEmail: string
    service: string
    draftJson: JsonNullValueInput | InputJsonValue
    leadScore?: number | null
    inquiryId?: string | null
    receivedEmailId?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DraftProposalUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    draftJson?: JsonNullValueInput | InputJsonValue
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    receivedEmailId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DraftProposalUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    draftJson?: JsonNullValueInput | InputJsonValue
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    receivedEmailId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DraftProposalCreateManyInput = {
    id?: string
    source?: string
    customerName: string
    customerEmail: string
    service: string
    draftJson: JsonNullValueInput | InputJsonValue
    leadScore?: number | null
    inquiryId?: string | null
    receivedEmailId?: string | null
    status?: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type DraftProposalUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    draftJson?: JsonNullValueInput | InputJsonValue
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    receivedEmailId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DraftProposalUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    draftJson?: JsonNullValueInput | InputJsonValue
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    receivedEmailId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WebhookLogCreateInput = {
    id?: string
    provider?: string
    event: string
    paystackId?: string | null
    reference?: string | null
    invoiceId?: string | null
    invoiceNumber?: string | null
    amountKobo?: number | null
    currency?: string | null
    signatureValid?: boolean
    source?: string
    status?: string
    result?: JsonNullValueInput | InputJsonValue
    payload?: JsonNullValueInput | InputJsonValue
    error?: string | null
    receivedAt?: Date | string
    processedAt?: Date | string | null
  }

  export type WebhookLogUncheckedCreateInput = {
    id?: string
    provider?: string
    event: string
    paystackId?: string | null
    reference?: string | null
    invoiceId?: string | null
    invoiceNumber?: string | null
    amountKobo?: number | null
    currency?: string | null
    signatureValid?: boolean
    source?: string
    status?: string
    result?: JsonNullValueInput | InputJsonValue
    payload?: JsonNullValueInput | InputJsonValue
    error?: string | null
    receivedAt?: Date | string
    processedAt?: Date | string | null
  }

  export type WebhookLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    event?: StringFieldUpdateOperationsInput | string
    paystackId?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    amountKobo?: NullableIntFieldUpdateOperationsInput | number | null
    currency?: NullableStringFieldUpdateOperationsInput | string | null
    signatureValid?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    result?: JsonNullValueInput | InputJsonValue
    payload?: JsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type WebhookLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    event?: StringFieldUpdateOperationsInput | string
    paystackId?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    amountKobo?: NullableIntFieldUpdateOperationsInput | number | null
    currency?: NullableStringFieldUpdateOperationsInput | string | null
    signatureValid?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    result?: JsonNullValueInput | InputJsonValue
    payload?: JsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type WebhookLogCreateManyInput = {
    id?: string
    provider?: string
    event: string
    paystackId?: string | null
    reference?: string | null
    invoiceId?: string | null
    invoiceNumber?: string | null
    amountKobo?: number | null
    currency?: string | null
    signatureValid?: boolean
    source?: string
    status?: string
    result?: JsonNullValueInput | InputJsonValue
    payload?: JsonNullValueInput | InputJsonValue
    error?: string | null
    receivedAt?: Date | string
    processedAt?: Date | string | null
  }

  export type WebhookLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    event?: StringFieldUpdateOperationsInput | string
    paystackId?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    amountKobo?: NullableIntFieldUpdateOperationsInput | number | null
    currency?: NullableStringFieldUpdateOperationsInput | string | null
    signatureValid?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    result?: JsonNullValueInput | InputJsonValue
    payload?: JsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type WebhookLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    event?: StringFieldUpdateOperationsInput | string
    paystackId?: NullableStringFieldUpdateOperationsInput | string | null
    reference?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    invoiceNumber?: NullableStringFieldUpdateOperationsInput | string | null
    amountKobo?: NullableIntFieldUpdateOperationsInput | number | null
    currency?: NullableStringFieldUpdateOperationsInput | string | null
    signatureValid?: BoolFieldUpdateOperationsInput | boolean
    source?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    result?: JsonNullValueInput | InputJsonValue
    payload?: JsonNullValueInput | InputJsonValue
    error?: NullableStringFieldUpdateOperationsInput | string | null
    receivedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type AdminSessionCreateInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type AdminSessionUncheckedCreateInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type AdminSessionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminSessionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminSessionCreateManyInput = {
    id?: string
    token: string
    expiresAt: Date | string
    createdAt?: Date | string
  }

  export type AdminSessionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AdminSessionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    expiresAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriberCreateInput = {
    id?: string
    email: string
    status?: string
    confirmToken?: string | null
    unsubscribeToken?: string | null
    confirmedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriberUncheckedCreateInput = {
    id?: string
    email: string
    status?: string
    confirmToken?: string | null
    unsubscribeToken?: string | null
    confirmedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriberUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    confirmToken?: NullableStringFieldUpdateOperationsInput | string | null
    unsubscribeToken?: NullableStringFieldUpdateOperationsInput | string | null
    confirmedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriberUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    confirmToken?: NullableStringFieldUpdateOperationsInput | string | null
    unsubscribeToken?: NullableStringFieldUpdateOperationsInput | string | null
    confirmedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriberCreateManyInput = {
    id?: string
    email: string
    status?: string
    confirmToken?: string | null
    unsubscribeToken?: string | null
    confirmedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type SubscriberUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    confirmToken?: NullableStringFieldUpdateOperationsInput | string | null
    unsubscribeToken?: NullableStringFieldUpdateOperationsInput | string | null
    confirmedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SubscriberUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    confirmToken?: NullableStringFieldUpdateOperationsInput | string | null
    unsubscribeToken?: NullableStringFieldUpdateOperationsInput | string | null
    confirmedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostCreateInput = {
    id?: string
    title: string
    slug: string
    excerpt: string
    content: string
    category: string
    tags?: JsonNullValueInput | InputJsonValue
    author?: string
    status?: string
    publishedAt?: Date | string | null
    notifySentAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUncheckedCreateInput = {
    id?: string
    title: string
    slug: string
    excerpt: string
    content: string
    category: string
    tags?: JsonNullValueInput | InputJsonValue
    author?: string
    status?: string
    publishedAt?: Date | string | null
    notifySentAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    excerpt?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: JsonNullValueInput | InputJsonValue
    author?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notifySentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    excerpt?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: JsonNullValueInput | InputJsonValue
    author?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notifySentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostCreateManyInput = {
    id?: string
    title: string
    slug: string
    excerpt: string
    content: string
    category: string
    tags?: JsonNullValueInput | InputJsonValue
    author?: string
    status?: string
    publishedAt?: Date | string | null
    notifySentAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PostUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    excerpt?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: JsonNullValueInput | InputJsonValue
    author?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notifySentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PostUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    title?: StringFieldUpdateOperationsInput | string
    slug?: StringFieldUpdateOperationsInput | string
    excerpt?: StringFieldUpdateOperationsInput | string
    content?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    tags?: JsonNullValueInput | InputJsonValue
    author?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    publishedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    notifySentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestimonialCreateInput = {
    id?: string
    name: string
    role: string
    service: string
    text: string
    rating?: number
    avatar?: string | null
    status?: string
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TestimonialUncheckedCreateInput = {
    id?: string
    name: string
    role: string
    service: string
    text: string
    rating?: number
    avatar?: string | null
    status?: string
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TestimonialUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestimonialUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestimonialCreateManyInput = {
    id?: string
    name: string
    role: string
    service: string
    text: string
    rating?: number
    avatar?: string | null
    status?: string
    sortOrder?: number
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TestimonialUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TestimonialUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    service?: StringFieldUpdateOperationsInput | string
    text?: StringFieldUpdateOperationsInput | string
    rating?: IntFieldUpdateOperationsInput | number
    avatar?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    sortOrder?: IntFieldUpdateOperationsInput | number
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmailLogCreateInput = {
    id?: string
    type: string
    recipientEmail: string
    subject: string
    postId?: string | null
    subscriberId?: string | null
    status?: string
    error?: string | null
    sentAt?: Date | string
    bodyText?: string | null
    bodyHtml?: string | null
    attachments?: JsonNullValueInput | InputJsonValue
    invoiceId?: string | null
    provider?: string | null
  }

  export type EmailLogUncheckedCreateInput = {
    id?: string
    type: string
    recipientEmail: string
    subject: string
    postId?: string | null
    subscriberId?: string | null
    status?: string
    error?: string | null
    sentAt?: Date | string
    bodyText?: string | null
    bodyHtml?: string | null
    attachments?: JsonNullValueInput | InputJsonValue
    invoiceId?: string | null
    provider?: string | null
  }

  export type EmailLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    recipientEmail?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    postId?: NullableStringFieldUpdateOperationsInput | string | null
    subscriberId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bodyText?: NullableStringFieldUpdateOperationsInput | string | null
    bodyHtml?: NullableStringFieldUpdateOperationsInput | string | null
    attachments?: JsonNullValueInput | InputJsonValue
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EmailLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    recipientEmail?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    postId?: NullableStringFieldUpdateOperationsInput | string | null
    subscriberId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bodyText?: NullableStringFieldUpdateOperationsInput | string | null
    bodyHtml?: NullableStringFieldUpdateOperationsInput | string | null
    attachments?: JsonNullValueInput | InputJsonValue
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EmailLogCreateManyInput = {
    id?: string
    type: string
    recipientEmail: string
    subject: string
    postId?: string | null
    subscriberId?: string | null
    status?: string
    error?: string | null
    sentAt?: Date | string
    bodyText?: string | null
    bodyHtml?: string | null
    attachments?: JsonNullValueInput | InputJsonValue
    invoiceId?: string | null
    provider?: string | null
  }

  export type EmailLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    recipientEmail?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    postId?: NullableStringFieldUpdateOperationsInput | string | null
    subscriberId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bodyText?: NullableStringFieldUpdateOperationsInput | string | null
    bodyHtml?: NullableStringFieldUpdateOperationsInput | string | null
    attachments?: JsonNullValueInput | InputJsonValue
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EmailLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    recipientEmail?: StringFieldUpdateOperationsInput | string
    subject?: StringFieldUpdateOperationsInput | string
    postId?: NullableStringFieldUpdateOperationsInput | string | null
    subscriberId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
    bodyText?: NullableStringFieldUpdateOperationsInput | string | null
    bodyHtml?: NullableStringFieldUpdateOperationsInput | string | null
    attachments?: JsonNullValueInput | InputJsonValue
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    provider?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EmailProviderConfigCreateInput = {
    id?: string
    provider: string
    displayName: string
    priority?: number
    enabled?: boolean
    credentialsEnc: string
    lastTestAt?: Date | string | null
    lastTestStatus?: string | null
    lastTestError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EmailProviderConfigUncheckedCreateInput = {
    id?: string
    provider: string
    displayName: string
    priority?: number
    enabled?: boolean
    credentialsEnc: string
    lastTestAt?: Date | string | null
    lastTestStatus?: string | null
    lastTestError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EmailProviderConfigUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    priority?: IntFieldUpdateOperationsInput | number
    enabled?: BoolFieldUpdateOperationsInput | boolean
    credentialsEnc?: StringFieldUpdateOperationsInput | string
    lastTestAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastTestStatus?: NullableStringFieldUpdateOperationsInput | string | null
    lastTestError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmailProviderConfigUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    priority?: IntFieldUpdateOperationsInput | number
    enabled?: BoolFieldUpdateOperationsInput | boolean
    credentialsEnc?: StringFieldUpdateOperationsInput | string
    lastTestAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastTestStatus?: NullableStringFieldUpdateOperationsInput | string | null
    lastTestError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmailProviderConfigCreateManyInput = {
    id?: string
    provider: string
    displayName: string
    priority?: number
    enabled?: boolean
    credentialsEnc: string
    lastTestAt?: Date | string | null
    lastTestStatus?: string | null
    lastTestError?: string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EmailProviderConfigUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    priority?: IntFieldUpdateOperationsInput | number
    enabled?: BoolFieldUpdateOperationsInput | boolean
    credentialsEnc?: StringFieldUpdateOperationsInput | string
    lastTestAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastTestStatus?: NullableStringFieldUpdateOperationsInput | string | null
    lastTestError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EmailProviderConfigUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    provider?: StringFieldUpdateOperationsInput | string
    displayName?: StringFieldUpdateOperationsInput | string
    priority?: IntFieldUpdateOperationsInput | number
    enabled?: BoolFieldUpdateOperationsInput | boolean
    credentialsEnc?: StringFieldUpdateOperationsInput | string
    lastTestAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastTestStatus?: NullableStringFieldUpdateOperationsInput | string | null
    lastTestError?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceivedEmailCreateInput = {
    id?: string
    source?: string
    name?: string | null
    email?: string | null
    phone?: string | null
    subject?: string | null
    message: string
    leadScore?: number | null
    meta?: JsonNullValueInput | InputJsonValue
    inquiryId?: string | null
    createdAt?: Date | string
  }

  export type ReceivedEmailUncheckedCreateInput = {
    id?: string
    source?: string
    name?: string | null
    email?: string | null
    phone?: string | null
    subject?: string | null
    message: string
    leadScore?: number | null
    meta?: JsonNullValueInput | InputJsonValue
    inquiryId?: string | null
    createdAt?: Date | string
  }

  export type ReceivedEmailUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    message?: StringFieldUpdateOperationsInput | string
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    meta?: JsonNullValueInput | InputJsonValue
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceivedEmailUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    message?: StringFieldUpdateOperationsInput | string
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    meta?: JsonNullValueInput | InputJsonValue
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceivedEmailCreateManyInput = {
    id?: string
    source?: string
    name?: string | null
    email?: string | null
    phone?: string | null
    subject?: string | null
    message: string
    leadScore?: number | null
    meta?: JsonNullValueInput | InputJsonValue
    inquiryId?: string | null
    createdAt?: Date | string
  }

  export type ReceivedEmailUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    message?: StringFieldUpdateOperationsInput | string
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    meta?: JsonNullValueInput | InputJsonValue
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReceivedEmailUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    source?: StringFieldUpdateOperationsInput | string
    name?: NullableStringFieldUpdateOperationsInput | string | null
    email?: NullableStringFieldUpdateOperationsInput | string | null
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    message?: StringFieldUpdateOperationsInput | string
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    meta?: JsonNullValueInput | InputJsonValue
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceCreateInput = {
    id?: string
    invoiceNumber: string
    inquiryId?: string | null
    customerName: string
    customerEmail: string
    customerPhone?: string | null
    service: string
    description?: string | null
    proposalJson?: NullableJsonNullValueInput | InputJsonValue
    amountKobo: number
    currency?: string
    durationLabel?: string | null
    dueDate?: Date | string | null
    status?: string
    dvaAccountNumber?: string | null
    dvaBankName?: string | null
    dvaBankCode?: string | null
    paystackReference?: string | null
    pdfUrl?: string | null
    pdfStorage?: string | null
    secureToken?: string | null
    portalViewedAt?: Date | string | null
    paymentProofUrl?: string | null
    paymentProofName?: string | null
    paymentProofUploadedAt?: Date | string | null
    paidAt?: Date | string | null
    sentAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceUncheckedCreateInput = {
    id?: string
    invoiceNumber: string
    inquiryId?: string | null
    customerName: string
    customerEmail: string
    customerPhone?: string | null
    service: string
    description?: string | null
    proposalJson?: NullableJsonNullValueInput | InputJsonValue
    amountKobo: number
    currency?: string
    durationLabel?: string | null
    dueDate?: Date | string | null
    status?: string
    dvaAccountNumber?: string | null
    dvaBankName?: string | null
    dvaBankCode?: string | null
    paystackReference?: string | null
    pdfUrl?: string | null
    pdfStorage?: string | null
    secureToken?: string | null
    portalViewedAt?: Date | string | null
    paymentProofUrl?: string | null
    paymentProofName?: string | null
    paymentProofUploadedAt?: Date | string | null
    paidAt?: Date | string | null
    sentAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    service?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    proposalJson?: NullableJsonNullValueInput | InputJsonValue
    amountKobo?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    durationLabel?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    dvaAccountNumber?: NullableStringFieldUpdateOperationsInput | string | null
    dvaBankName?: NullableStringFieldUpdateOperationsInput | string | null
    dvaBankCode?: NullableStringFieldUpdateOperationsInput | string | null
    paystackReference?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    pdfStorage?: NullableStringFieldUpdateOperationsInput | string | null
    secureToken?: NullableStringFieldUpdateOperationsInput | string | null
    portalViewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paymentProofUrl?: NullableStringFieldUpdateOperationsInput | string | null
    paymentProofName?: NullableStringFieldUpdateOperationsInput | string | null
    paymentProofUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    service?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    proposalJson?: NullableJsonNullValueInput | InputJsonValue
    amountKobo?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    durationLabel?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    dvaAccountNumber?: NullableStringFieldUpdateOperationsInput | string | null
    dvaBankName?: NullableStringFieldUpdateOperationsInput | string | null
    dvaBankCode?: NullableStringFieldUpdateOperationsInput | string | null
    paystackReference?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    pdfStorage?: NullableStringFieldUpdateOperationsInput | string | null
    secureToken?: NullableStringFieldUpdateOperationsInput | string | null
    portalViewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paymentProofUrl?: NullableStringFieldUpdateOperationsInput | string | null
    paymentProofName?: NullableStringFieldUpdateOperationsInput | string | null
    paymentProofUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceCreateManyInput = {
    id?: string
    invoiceNumber: string
    inquiryId?: string | null
    customerName: string
    customerEmail: string
    customerPhone?: string | null
    service: string
    description?: string | null
    proposalJson?: NullableJsonNullValueInput | InputJsonValue
    amountKobo: number
    currency?: string
    durationLabel?: string | null
    dueDate?: Date | string | null
    status?: string
    dvaAccountNumber?: string | null
    dvaBankName?: string | null
    dvaBankCode?: string | null
    paystackReference?: string | null
    pdfUrl?: string | null
    pdfStorage?: string | null
    secureToken?: string | null
    portalViewedAt?: Date | string | null
    paymentProofUrl?: string | null
    paymentProofName?: string | null
    paymentProofUploadedAt?: Date | string | null
    paidAt?: Date | string | null
    sentAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type InvoiceUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    service?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    proposalJson?: NullableJsonNullValueInput | InputJsonValue
    amountKobo?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    durationLabel?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    dvaAccountNumber?: NullableStringFieldUpdateOperationsInput | string | null
    dvaBankName?: NullableStringFieldUpdateOperationsInput | string | null
    dvaBankCode?: NullableStringFieldUpdateOperationsInput | string | null
    paystackReference?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    pdfStorage?: NullableStringFieldUpdateOperationsInput | string | null
    secureToken?: NullableStringFieldUpdateOperationsInput | string | null
    portalViewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paymentProofUrl?: NullableStringFieldUpdateOperationsInput | string | null
    paymentProofName?: NullableStringFieldUpdateOperationsInput | string | null
    paymentProofUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type InvoiceUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    invoiceNumber?: StringFieldUpdateOperationsInput | string
    inquiryId?: NullableStringFieldUpdateOperationsInput | string | null
    customerName?: StringFieldUpdateOperationsInput | string
    customerEmail?: StringFieldUpdateOperationsInput | string
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    service?: StringFieldUpdateOperationsInput | string
    description?: NullableStringFieldUpdateOperationsInput | string | null
    proposalJson?: NullableJsonNullValueInput | InputJsonValue
    amountKobo?: IntFieldUpdateOperationsInput | number
    currency?: StringFieldUpdateOperationsInput | string
    durationLabel?: NullableStringFieldUpdateOperationsInput | string | null
    dueDate?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    status?: StringFieldUpdateOperationsInput | string
    dvaAccountNumber?: NullableStringFieldUpdateOperationsInput | string | null
    dvaBankName?: NullableStringFieldUpdateOperationsInput | string | null
    dvaBankCode?: NullableStringFieldUpdateOperationsInput | string | null
    paystackReference?: NullableStringFieldUpdateOperationsInput | string | null
    pdfUrl?: NullableStringFieldUpdateOperationsInput | string | null
    pdfStorage?: NullableStringFieldUpdateOperationsInput | string | null
    secureToken?: NullableStringFieldUpdateOperationsInput | string | null
    portalViewedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paymentProofUrl?: NullableStringFieldUpdateOperationsInput | string | null
    paymentProofName?: NullableStringFieldUpdateOperationsInput | string | null
    paymentProofUploadedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    paidAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    sentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventRecordCreateInput = {
    id?: string
    type: string
    customerEmail?: string | null
    customerPhone?: string | null
    eventDate: Date | string
    relatedInvoiceId?: string | null
    payload?: JsonNullValueInput | InputJsonValue
    status?: string
    processedAt?: Date | string | null
    lastSentAt?: Date | string | null
    createdAt?: Date | string
  }

  export type EventRecordUncheckedCreateInput = {
    id?: string
    type: string
    customerEmail?: string | null
    customerPhone?: string | null
    eventDate: Date | string
    relatedInvoiceId?: string | null
    payload?: JsonNullValueInput | InputJsonValue
    status?: string
    processedAt?: Date | string | null
    lastSentAt?: Date | string | null
    createdAt?: Date | string
  }

  export type EventRecordUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    eventDate?: DateTimeFieldUpdateOperationsInput | Date | string
    relatedInvoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    payload?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventRecordUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    eventDate?: DateTimeFieldUpdateOperationsInput | Date | string
    relatedInvoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    payload?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventRecordCreateManyInput = {
    id?: string
    type: string
    customerEmail?: string | null
    customerPhone?: string | null
    eventDate: Date | string
    relatedInvoiceId?: string | null
    payload?: JsonNullValueInput | InputJsonValue
    status?: string
    processedAt?: Date | string | null
    lastSentAt?: Date | string | null
    createdAt?: Date | string
  }

  export type EventRecordUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    eventDate?: DateTimeFieldUpdateOperationsInput | Date | string
    relatedInvoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    payload?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EventRecordUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    customerEmail?: NullableStringFieldUpdateOperationsInput | string | null
    customerPhone?: NullableStringFieldUpdateOperationsInput | string | null
    eventDate?: DateTimeFieldUpdateOperationsInput | Date | string
    relatedInvoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    payload?: JsonNullValueInput | InputJsonValue
    status?: StringFieldUpdateOperationsInput | string
    processedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lastSentAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WhatsAppMessageCreateInput = {
    id?: string
    direction: string
    toPhone?: string | null
    fromPhone?: string | null
    messageText?: string | null
    mediaUrl?: string | null
    mediaFilename?: string | null
    relatedInvoiceId?: string | null
    status?: string
    sentAt?: Date | string
  }

  export type WhatsAppMessageUncheckedCreateInput = {
    id?: string
    direction: string
    toPhone?: string | null
    fromPhone?: string | null
    messageText?: string | null
    mediaUrl?: string | null
    mediaFilename?: string | null
    relatedInvoiceId?: string | null
    status?: string
    sentAt?: Date | string
  }

  export type WhatsAppMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    toPhone?: NullableStringFieldUpdateOperationsInput | string | null
    fromPhone?: NullableStringFieldUpdateOperationsInput | string | null
    messageText?: NullableStringFieldUpdateOperationsInput | string | null
    mediaUrl?: NullableStringFieldUpdateOperationsInput | string | null
    mediaFilename?: NullableStringFieldUpdateOperationsInput | string | null
    relatedInvoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WhatsAppMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    toPhone?: NullableStringFieldUpdateOperationsInput | string | null
    fromPhone?: NullableStringFieldUpdateOperationsInput | string | null
    messageText?: NullableStringFieldUpdateOperationsInput | string | null
    mediaUrl?: NullableStringFieldUpdateOperationsInput | string | null
    mediaFilename?: NullableStringFieldUpdateOperationsInput | string | null
    relatedInvoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WhatsAppMessageCreateManyInput = {
    id?: string
    direction: string
    toPhone?: string | null
    fromPhone?: string | null
    messageText?: string | null
    mediaUrl?: string | null
    mediaFilename?: string | null
    relatedInvoiceId?: string | null
    status?: string
    sentAt?: Date | string
  }

  export type WhatsAppMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    toPhone?: NullableStringFieldUpdateOperationsInput | string | null
    fromPhone?: NullableStringFieldUpdateOperationsInput | string | null
    messageText?: NullableStringFieldUpdateOperationsInput | string | null
    mediaUrl?: NullableStringFieldUpdateOperationsInput | string | null
    mediaFilename?: NullableStringFieldUpdateOperationsInput | string | null
    relatedInvoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WhatsAppMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    direction?: StringFieldUpdateOperationsInput | string
    toPhone?: NullableStringFieldUpdateOperationsInput | string | null
    fromPhone?: NullableStringFieldUpdateOperationsInput | string | null
    messageText?: NullableStringFieldUpdateOperationsInput | string | null
    mediaUrl?: NullableStringFieldUpdateOperationsInput | string | null
    mediaFilename?: NullableStringFieldUpdateOperationsInput | string | null
    relatedInvoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AnalyticsEventCreateInput = {
    id?: string
    type: string
    invoiceId?: string | null
    secureToken?: string | null
    sessionId?: string | null
    meta?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AnalyticsEventUncheckedCreateInput = {
    id?: string
    type: string
    invoiceId?: string | null
    secureToken?: string | null
    sessionId?: string | null
    meta?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AnalyticsEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    secureToken?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    meta?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AnalyticsEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    secureToken?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    meta?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AnalyticsEventCreateManyInput = {
    id?: string
    type: string
    invoiceId?: string | null
    secureToken?: string | null
    sessionId?: string | null
    meta?: JsonNullValueInput | InputJsonValue
    createdAt?: Date | string
  }

  export type AnalyticsEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    secureToken?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    meta?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AnalyticsEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    type?: StringFieldUpdateOperationsInput | string
    invoiceId?: NullableStringFieldUpdateOperationsInput | string | null
    secureToken?: NullableStringFieldUpdateOperationsInput | string | null
    sessionId?: NullableStringFieldUpdateOperationsInput | string | null
    meta?: JsonNullValueInput | InputJsonValue
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BackupLogCreateInput = {
    id?: string
    kind?: string
    target?: string
    status?: string
    fileName?: string | null
    sizeBytes?: number | null
    durationMs?: number | null
    error?: string | null
    createdAt?: Date | string
  }

  export type BackupLogUncheckedCreateInput = {
    id?: string
    kind?: string
    target?: string
    status?: string
    fileName?: string | null
    sizeBytes?: number | null
    durationMs?: number | null
    error?: string | null
    createdAt?: Date | string
  }

  export type BackupLogUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    target?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    fileName?: NullableStringFieldUpdateOperationsInput | string | null
    sizeBytes?: NullableIntFieldUpdateOperationsInput | number | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BackupLogUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    target?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    fileName?: NullableStringFieldUpdateOperationsInput | string | null
    sizeBytes?: NullableIntFieldUpdateOperationsInput | number | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BackupLogCreateManyInput = {
    id?: string
    kind?: string
    target?: string
    status?: string
    fileName?: string | null
    sizeBytes?: number | null
    durationMs?: number | null
    error?: string | null
    createdAt?: Date | string
  }

  export type BackupLogUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    target?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    fileName?: NullableStringFieldUpdateOperationsInput | string | null
    sizeBytes?: NullableIntFieldUpdateOperationsInput | number | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BackupLogUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    kind?: StringFieldUpdateOperationsInput | string
    target?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    fileName?: NullableStringFieldUpdateOperationsInput | string | null
    sizeBytes?: NullableIntFieldUpdateOperationsInput | number | null
    durationMs?: NullableIntFieldUpdateOperationsInput | number | null
    error?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerCreateInput = {
    id?: string
    name: string
    email: string
    phone?: string | null
    whatsapp?: string | null
    company?: string | null
    role?: string | null
    status?: string
    tags?: JsonNullValueInput | InputJsonValue
    notes?: string | null
    source?: string
    leadScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastContactAt?: Date | string | null
  }

  export type CustomerUncheckedCreateInput = {
    id?: string
    name: string
    email: string
    phone?: string | null
    whatsapp?: string | null
    company?: string | null
    role?: string | null
    status?: string
    tags?: JsonNullValueInput | InputJsonValue
    notes?: string | null
    source?: string
    leadScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastContactAt?: Date | string | null
  }

  export type CustomerUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    whatsapp?: NullableStringFieldUpdateOperationsInput | string | null
    company?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    tags?: JsonNullValueInput | InputJsonValue
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastContactAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CustomerUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    whatsapp?: NullableStringFieldUpdateOperationsInput | string | null
    company?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    tags?: JsonNullValueInput | InputJsonValue
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastContactAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CustomerCreateManyInput = {
    id?: string
    name: string
    email: string
    phone?: string | null
    whatsapp?: string | null
    company?: string | null
    role?: string | null
    status?: string
    tags?: JsonNullValueInput | InputJsonValue
    notes?: string | null
    source?: string
    leadScore?: number | null
    createdAt?: Date | string
    updatedAt?: Date | string
    lastContactAt?: Date | string | null
  }

  export type CustomerUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    whatsapp?: NullableStringFieldUpdateOperationsInput | string | null
    company?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    tags?: JsonNullValueInput | InputJsonValue
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastContactAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CustomerUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    phone?: NullableStringFieldUpdateOperationsInput | string | null
    whatsapp?: NullableStringFieldUpdateOperationsInput | string | null
    company?: NullableStringFieldUpdateOperationsInput | string | null
    role?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    tags?: JsonNullValueInput | InputJsonValue
    notes?: NullableStringFieldUpdateOperationsInput | string | null
    source?: StringFieldUpdateOperationsInput | string
    leadScore?: NullableIntFieldUpdateOperationsInput | number | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastContactAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CustomerNoteCreateInput = {
    id?: string
    customerId: string
    author?: string
    body: string
    context?: string | null
    createdAt?: Date | string
  }

  export type CustomerNoteUncheckedCreateInput = {
    id?: string
    customerId: string
    author?: string
    body: string
    context?: string | null
    createdAt?: Date | string
  }

  export type CustomerNoteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    context?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerNoteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    context?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerNoteCreateManyInput = {
    id?: string
    customerId: string
    author?: string
    body: string
    context?: string | null
    createdAt?: Date | string
  }

  export type CustomerNoteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    context?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerNoteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerId?: StringFieldUpdateOperationsInput | string
    author?: StringFieldUpdateOperationsInput | string
    body?: StringFieldUpdateOperationsInput | string
    context?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerMessageCreateInput = {
    id?: string
    customerId?: string | null
    toEmail: string
    toPhone?: string | null
    channel: string
    subject?: string | null
    body: string
    status?: string
    error?: string | null
    sentAt?: Date | string
  }

  export type CustomerMessageUncheckedCreateInput = {
    id?: string
    customerId?: string | null
    toEmail: string
    toPhone?: string | null
    channel: string
    subject?: string | null
    body: string
    status?: string
    error?: string | null
    sentAt?: Date | string
  }

  export type CustomerMessageUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    toEmail?: StringFieldUpdateOperationsInput | string
    toPhone?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: StringFieldUpdateOperationsInput | string
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerMessageUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    toEmail?: StringFieldUpdateOperationsInput | string
    toPhone?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: StringFieldUpdateOperationsInput | string
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerMessageCreateManyInput = {
    id?: string
    customerId?: string | null
    toEmail: string
    toPhone?: string | null
    channel: string
    subject?: string | null
    body: string
    status?: string
    error?: string | null
    sentAt?: Date | string
  }

  export type CustomerMessageUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    toEmail?: StringFieldUpdateOperationsInput | string
    toPhone?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: StringFieldUpdateOperationsInput | string
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CustomerMessageUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    customerId?: NullableStringFieldUpdateOperationsInput | string | null
    toEmail?: StringFieldUpdateOperationsInput | string
    toPhone?: NullableStringFieldUpdateOperationsInput | string | null
    channel?: StringFieldUpdateOperationsInput | string
    subject?: NullableStringFieldUpdateOperationsInput | string | null
    body?: StringFieldUpdateOperationsInput | string
    status?: StringFieldUpdateOperationsInput | string
    error?: NullableStringFieldUpdateOperationsInput | string | null
    sentAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type InquiryCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    whatsapp?: SortOrder
    service?: SortOrder
    addlService?: SortOrder
    budget?: SortOrder
    message?: SortOrder
    status?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InquiryMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    whatsapp?: SortOrder
    service?: SortOrder
    addlService?: SortOrder
    budget?: SortOrder
    message?: SortOrder
    status?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InquiryMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    whatsapp?: SortOrder
    service?: SortOrder
    addlService?: SortOrder
    budget?: SortOrder
    message?: SortOrder
    status?: SortOrder
    source?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type DraftProposalCountOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    service?: SortOrder
    draftJson?: SortOrder
    leadScore?: SortOrder
    inquiryId?: SortOrder
    receivedEmailId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DraftProposalAvgOrderByAggregateInput = {
    leadScore?: SortOrder
  }

  export type DraftProposalMaxOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    service?: SortOrder
    leadScore?: SortOrder
    inquiryId?: SortOrder
    receivedEmailId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DraftProposalMinOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    service?: SortOrder
    leadScore?: SortOrder
    inquiryId?: SortOrder
    receivedEmailId?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DraftProposalSumOrderByAggregateInput = {
    leadScore?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type WebhookLogProviderEventPaystackIdCompoundUniqueInput = {
    provider: string
    event: string
    paystackId: string
  }

  export type WebhookLogCountOrderByAggregateInput = {
    id?: SortOrder
    provider?: SortOrder
    event?: SortOrder
    paystackId?: SortOrder
    reference?: SortOrder
    invoiceId?: SortOrder
    invoiceNumber?: SortOrder
    amountKobo?: SortOrder
    currency?: SortOrder
    signatureValid?: SortOrder
    source?: SortOrder
    status?: SortOrder
    result?: SortOrder
    payload?: SortOrder
    error?: SortOrder
    receivedAt?: SortOrder
    processedAt?: SortOrder
  }

  export type WebhookLogAvgOrderByAggregateInput = {
    amountKobo?: SortOrder
  }

  export type WebhookLogMaxOrderByAggregateInput = {
    id?: SortOrder
    provider?: SortOrder
    event?: SortOrder
    paystackId?: SortOrder
    reference?: SortOrder
    invoiceId?: SortOrder
    invoiceNumber?: SortOrder
    amountKobo?: SortOrder
    currency?: SortOrder
    signatureValid?: SortOrder
    source?: SortOrder
    status?: SortOrder
    error?: SortOrder
    receivedAt?: SortOrder
    processedAt?: SortOrder
  }

  export type WebhookLogMinOrderByAggregateInput = {
    id?: SortOrder
    provider?: SortOrder
    event?: SortOrder
    paystackId?: SortOrder
    reference?: SortOrder
    invoiceId?: SortOrder
    invoiceNumber?: SortOrder
    amountKobo?: SortOrder
    currency?: SortOrder
    signatureValid?: SortOrder
    source?: SortOrder
    status?: SortOrder
    error?: SortOrder
    receivedAt?: SortOrder
    processedAt?: SortOrder
  }

  export type WebhookLogSumOrderByAggregateInput = {
    amountKobo?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type AdminSessionCountOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type AdminSessionMaxOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type AdminSessionMinOrderByAggregateInput = {
    id?: SortOrder
    token?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
  }

  export type SubscriberCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    status?: SortOrder
    confirmToken?: SortOrder
    unsubscribeToken?: SortOrder
    confirmedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubscriberMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    status?: SortOrder
    confirmToken?: SortOrder
    unsubscribeToken?: SortOrder
    confirmedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type SubscriberMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    status?: SortOrder
    confirmToken?: SortOrder
    unsubscribeToken?: SortOrder
    confirmedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostCountOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    excerpt?: SortOrder
    content?: SortOrder
    category?: SortOrder
    tags?: SortOrder
    author?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    notifySentAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostMaxOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    excerpt?: SortOrder
    content?: SortOrder
    category?: SortOrder
    author?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    notifySentAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PostMinOrderByAggregateInput = {
    id?: SortOrder
    title?: SortOrder
    slug?: SortOrder
    excerpt?: SortOrder
    content?: SortOrder
    category?: SortOrder
    author?: SortOrder
    status?: SortOrder
    publishedAt?: SortOrder
    notifySentAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type TestimonialCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    role?: SortOrder
    service?: SortOrder
    text?: SortOrder
    rating?: SortOrder
    avatar?: SortOrder
    status?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TestimonialAvgOrderByAggregateInput = {
    rating?: SortOrder
    sortOrder?: SortOrder
  }

  export type TestimonialMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    role?: SortOrder
    service?: SortOrder
    text?: SortOrder
    rating?: SortOrder
    avatar?: SortOrder
    status?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TestimonialMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    role?: SortOrder
    service?: SortOrder
    text?: SortOrder
    rating?: SortOrder
    avatar?: SortOrder
    status?: SortOrder
    sortOrder?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type TestimonialSumOrderByAggregateInput = {
    rating?: SortOrder
    sortOrder?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type EmailLogCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    recipientEmail?: SortOrder
    subject?: SortOrder
    postId?: SortOrder
    subscriberId?: SortOrder
    status?: SortOrder
    error?: SortOrder
    sentAt?: SortOrder
    bodyText?: SortOrder
    bodyHtml?: SortOrder
    attachments?: SortOrder
    invoiceId?: SortOrder
    provider?: SortOrder
  }

  export type EmailLogMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    recipientEmail?: SortOrder
    subject?: SortOrder
    postId?: SortOrder
    subscriberId?: SortOrder
    status?: SortOrder
    error?: SortOrder
    sentAt?: SortOrder
    bodyText?: SortOrder
    bodyHtml?: SortOrder
    invoiceId?: SortOrder
    provider?: SortOrder
  }

  export type EmailLogMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    recipientEmail?: SortOrder
    subject?: SortOrder
    postId?: SortOrder
    subscriberId?: SortOrder
    status?: SortOrder
    error?: SortOrder
    sentAt?: SortOrder
    bodyText?: SortOrder
    bodyHtml?: SortOrder
    invoiceId?: SortOrder
    provider?: SortOrder
  }

  export type EmailProviderConfigCountOrderByAggregateInput = {
    id?: SortOrder
    provider?: SortOrder
    displayName?: SortOrder
    priority?: SortOrder
    enabled?: SortOrder
    credentialsEnc?: SortOrder
    lastTestAt?: SortOrder
    lastTestStatus?: SortOrder
    lastTestError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EmailProviderConfigAvgOrderByAggregateInput = {
    priority?: SortOrder
  }

  export type EmailProviderConfigMaxOrderByAggregateInput = {
    id?: SortOrder
    provider?: SortOrder
    displayName?: SortOrder
    priority?: SortOrder
    enabled?: SortOrder
    credentialsEnc?: SortOrder
    lastTestAt?: SortOrder
    lastTestStatus?: SortOrder
    lastTestError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EmailProviderConfigMinOrderByAggregateInput = {
    id?: SortOrder
    provider?: SortOrder
    displayName?: SortOrder
    priority?: SortOrder
    enabled?: SortOrder
    credentialsEnc?: SortOrder
    lastTestAt?: SortOrder
    lastTestStatus?: SortOrder
    lastTestError?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EmailProviderConfigSumOrderByAggregateInput = {
    priority?: SortOrder
  }

  export type ReceivedEmailCountOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    subject?: SortOrder
    message?: SortOrder
    leadScore?: SortOrder
    meta?: SortOrder
    inquiryId?: SortOrder
    createdAt?: SortOrder
  }

  export type ReceivedEmailAvgOrderByAggregateInput = {
    leadScore?: SortOrder
  }

  export type ReceivedEmailMaxOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    subject?: SortOrder
    message?: SortOrder
    leadScore?: SortOrder
    inquiryId?: SortOrder
    createdAt?: SortOrder
  }

  export type ReceivedEmailMinOrderByAggregateInput = {
    id?: SortOrder
    source?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    subject?: SortOrder
    message?: SortOrder
    leadScore?: SortOrder
    inquiryId?: SortOrder
    createdAt?: SortOrder
  }

  export type ReceivedEmailSumOrderByAggregateInput = {
    leadScore?: SortOrder
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type InvoiceCountOrderByAggregateInput = {
    id?: SortOrder
    invoiceNumber?: SortOrder
    inquiryId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    customerPhone?: SortOrder
    service?: SortOrder
    description?: SortOrder
    proposalJson?: SortOrder
    amountKobo?: SortOrder
    currency?: SortOrder
    durationLabel?: SortOrder
    dueDate?: SortOrder
    status?: SortOrder
    dvaAccountNumber?: SortOrder
    dvaBankName?: SortOrder
    dvaBankCode?: SortOrder
    paystackReference?: SortOrder
    pdfUrl?: SortOrder
    pdfStorage?: SortOrder
    secureToken?: SortOrder
    portalViewedAt?: SortOrder
    paymentProofUrl?: SortOrder
    paymentProofName?: SortOrder
    paymentProofUploadedAt?: SortOrder
    paidAt?: SortOrder
    sentAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceAvgOrderByAggregateInput = {
    amountKobo?: SortOrder
  }

  export type InvoiceMaxOrderByAggregateInput = {
    id?: SortOrder
    invoiceNumber?: SortOrder
    inquiryId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    customerPhone?: SortOrder
    service?: SortOrder
    description?: SortOrder
    amountKobo?: SortOrder
    currency?: SortOrder
    durationLabel?: SortOrder
    dueDate?: SortOrder
    status?: SortOrder
    dvaAccountNumber?: SortOrder
    dvaBankName?: SortOrder
    dvaBankCode?: SortOrder
    paystackReference?: SortOrder
    pdfUrl?: SortOrder
    pdfStorage?: SortOrder
    secureToken?: SortOrder
    portalViewedAt?: SortOrder
    paymentProofUrl?: SortOrder
    paymentProofName?: SortOrder
    paymentProofUploadedAt?: SortOrder
    paidAt?: SortOrder
    sentAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceMinOrderByAggregateInput = {
    id?: SortOrder
    invoiceNumber?: SortOrder
    inquiryId?: SortOrder
    customerName?: SortOrder
    customerEmail?: SortOrder
    customerPhone?: SortOrder
    service?: SortOrder
    description?: SortOrder
    amountKobo?: SortOrder
    currency?: SortOrder
    durationLabel?: SortOrder
    dueDate?: SortOrder
    status?: SortOrder
    dvaAccountNumber?: SortOrder
    dvaBankName?: SortOrder
    dvaBankCode?: SortOrder
    paystackReference?: SortOrder
    pdfUrl?: SortOrder
    pdfStorage?: SortOrder
    secureToken?: SortOrder
    portalViewedAt?: SortOrder
    paymentProofUrl?: SortOrder
    paymentProofName?: SortOrder
    paymentProofUploadedAt?: SortOrder
    paidAt?: SortOrder
    sentAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type InvoiceSumOrderByAggregateInput = {
    amountKobo?: SortOrder
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type EventRecordCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    customerEmail?: SortOrder
    customerPhone?: SortOrder
    eventDate?: SortOrder
    relatedInvoiceId?: SortOrder
    payload?: SortOrder
    status?: SortOrder
    processedAt?: SortOrder
    lastSentAt?: SortOrder
    createdAt?: SortOrder
  }

  export type EventRecordMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    customerEmail?: SortOrder
    customerPhone?: SortOrder
    eventDate?: SortOrder
    relatedInvoiceId?: SortOrder
    status?: SortOrder
    processedAt?: SortOrder
    lastSentAt?: SortOrder
    createdAt?: SortOrder
  }

  export type EventRecordMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    customerEmail?: SortOrder
    customerPhone?: SortOrder
    eventDate?: SortOrder
    relatedInvoiceId?: SortOrder
    status?: SortOrder
    processedAt?: SortOrder
    lastSentAt?: SortOrder
    createdAt?: SortOrder
  }

  export type WhatsAppMessageCountOrderByAggregateInput = {
    id?: SortOrder
    direction?: SortOrder
    toPhone?: SortOrder
    fromPhone?: SortOrder
    messageText?: SortOrder
    mediaUrl?: SortOrder
    mediaFilename?: SortOrder
    relatedInvoiceId?: SortOrder
    status?: SortOrder
    sentAt?: SortOrder
  }

  export type WhatsAppMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    direction?: SortOrder
    toPhone?: SortOrder
    fromPhone?: SortOrder
    messageText?: SortOrder
    mediaUrl?: SortOrder
    mediaFilename?: SortOrder
    relatedInvoiceId?: SortOrder
    status?: SortOrder
    sentAt?: SortOrder
  }

  export type WhatsAppMessageMinOrderByAggregateInput = {
    id?: SortOrder
    direction?: SortOrder
    toPhone?: SortOrder
    fromPhone?: SortOrder
    messageText?: SortOrder
    mediaUrl?: SortOrder
    mediaFilename?: SortOrder
    relatedInvoiceId?: SortOrder
    status?: SortOrder
    sentAt?: SortOrder
  }

  export type AnalyticsEventCountOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    invoiceId?: SortOrder
    secureToken?: SortOrder
    sessionId?: SortOrder
    meta?: SortOrder
    createdAt?: SortOrder
  }

  export type AnalyticsEventMaxOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    invoiceId?: SortOrder
    secureToken?: SortOrder
    sessionId?: SortOrder
    createdAt?: SortOrder
  }

  export type AnalyticsEventMinOrderByAggregateInput = {
    id?: SortOrder
    type?: SortOrder
    invoiceId?: SortOrder
    secureToken?: SortOrder
    sessionId?: SortOrder
    createdAt?: SortOrder
  }

  export type BackupLogCountOrderByAggregateInput = {
    id?: SortOrder
    kind?: SortOrder
    target?: SortOrder
    status?: SortOrder
    fileName?: SortOrder
    sizeBytes?: SortOrder
    durationMs?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
  }

  export type BackupLogAvgOrderByAggregateInput = {
    sizeBytes?: SortOrder
    durationMs?: SortOrder
  }

  export type BackupLogMaxOrderByAggregateInput = {
    id?: SortOrder
    kind?: SortOrder
    target?: SortOrder
    status?: SortOrder
    fileName?: SortOrder
    sizeBytes?: SortOrder
    durationMs?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
  }

  export type BackupLogMinOrderByAggregateInput = {
    id?: SortOrder
    kind?: SortOrder
    target?: SortOrder
    status?: SortOrder
    fileName?: SortOrder
    sizeBytes?: SortOrder
    durationMs?: SortOrder
    error?: SortOrder
    createdAt?: SortOrder
  }

  export type BackupLogSumOrderByAggregateInput = {
    sizeBytes?: SortOrder
    durationMs?: SortOrder
  }

  export type CustomerCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    whatsapp?: SortOrder
    company?: SortOrder
    role?: SortOrder
    status?: SortOrder
    tags?: SortOrder
    notes?: SortOrder
    source?: SortOrder
    leadScore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastContactAt?: SortOrder
  }

  export type CustomerAvgOrderByAggregateInput = {
    leadScore?: SortOrder
  }

  export type CustomerMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    whatsapp?: SortOrder
    company?: SortOrder
    role?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    source?: SortOrder
    leadScore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastContactAt?: SortOrder
  }

  export type CustomerMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    email?: SortOrder
    phone?: SortOrder
    whatsapp?: SortOrder
    company?: SortOrder
    role?: SortOrder
    status?: SortOrder
    notes?: SortOrder
    source?: SortOrder
    leadScore?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastContactAt?: SortOrder
  }

  export type CustomerSumOrderByAggregateInput = {
    leadScore?: SortOrder
  }

  export type CustomerNoteCountOrderByAggregateInput = {
    id?: SortOrder
    customerId?: SortOrder
    author?: SortOrder
    body?: SortOrder
    context?: SortOrder
    createdAt?: SortOrder
  }

  export type CustomerNoteMaxOrderByAggregateInput = {
    id?: SortOrder
    customerId?: SortOrder
    author?: SortOrder
    body?: SortOrder
    context?: SortOrder
    createdAt?: SortOrder
  }

  export type CustomerNoteMinOrderByAggregateInput = {
    id?: SortOrder
    customerId?: SortOrder
    author?: SortOrder
    body?: SortOrder
    context?: SortOrder
    createdAt?: SortOrder
  }

  export type CustomerMessageCountOrderByAggregateInput = {
    id?: SortOrder
    customerId?: SortOrder
    toEmail?: SortOrder
    toPhone?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    status?: SortOrder
    error?: SortOrder
    sentAt?: SortOrder
  }

  export type CustomerMessageMaxOrderByAggregateInput = {
    id?: SortOrder
    customerId?: SortOrder
    toEmail?: SortOrder
    toPhone?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    status?: SortOrder
    error?: SortOrder
    sentAt?: SortOrder
  }

  export type CustomerMessageMinOrderByAggregateInput = {
    id?: SortOrder
    customerId?: SortOrder
    toEmail?: SortOrder
    toPhone?: SortOrder
    channel?: SortOrder
    subject?: SortOrder
    body?: SortOrder
    status?: SortOrder
    error?: SortOrder
    sentAt?: SortOrder
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}