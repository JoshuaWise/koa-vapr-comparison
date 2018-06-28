# koa-vapr-comparison

This is an opinionated study into the theory and practice of Koa and Vapr as competing HTTP frameworks.

## Background

Throughout the Node.js ecosystem, there exist many popular frameworks for building HTTP-based services. Some of these frameworks are very tailored towards specific use cases, and are not appropriate for the general case. Others, which are usually the most popular ones, are very general and may be applied to almost any HTTP-related task (aside from proxy servers, which are beyond the scope of this study). Notable examples include [Express](https://github.com/expressjs/express), [Restify](https://github.com/restify/node-restify), [Fastify](https://github.com/fastify/fastify), [Hapi](https://github.com/hapijs/hapi), and [Koa](https://github.com/koajs/koa). Adding to that list, [Vapr](https://github.com/JoshuaWise/vapr) is a new generic HTTP framework (created by the same author as this study). In particular, Koa and Vapr are of heightened interest. Both of these frameworks have similar capabilities, share similar design principles, and, by the opinions of this author, are the most advanced in terms of providing high-level functionality in exchange for minimal code use. Perhaps the most important quality though, is that both Koa and Vapr are the least opinionated of these frameworks (in the context of an HTTP framework, being "opinionated" is defined by providing features related to specific application use cases, rather than just matters relevant to the HTTP procotol). Although a more complete study would include all of the aforementioned frameworks, for the reasons just stated we will only focus on comparing Koa and Vapr.

The goal of this study is to convince readers that Vapr is the superior foundation for building generic HTTP services in Node.js. Despite this goal, we are careful not to ignore important spots where Koa may be superior. Some of such cases may be due to diverging priorities or intentional trade-offs. We will compare in terms of both theory and practice. There will be talk of design philosophy and "elegance", but also of relevant examples of performance and stability benchmarks. As a final note, we mention that Vapr is directly *inspired* by Koa, and its development would not have been possible without the foresight provided by the authors of Koa.

## Overview

This study is broken into four main sections.

1. [Power and Elegance](#1-power-and-elegance)
2. [Feature Completeness](#2-feature-completeness)
3. [Stability and Robustness](#3-stability-and-robustness)
4. [Performance](#4-performance)

The audience of this study is assumed to have had exposure to relevant programming concepts such as asynchronicity and higher-order functions, which are frequently utilized in Node.js. A familiarity with the [HTTP protocol](https://tools.ietf.org/html/rfc7230) is also assumed, and direct experience with popular HTTP frameworks such as [Express](https://github.com/expressjs/express) is preferred.

## 1. Power and Elegance

### 1.1. Defining the criteria

Programs are often described in terms of varying "power" and "elegance". The former refers to how easy it is to correctly perform complex tasks, where generally fewer lines of code equates to greater power. The latters refers to the intuitiveness of turning simple programs into more complex ones, where requiring fewer changes and fewer new concepts equates to greater elegance. The two properties are closely related, but independent of each other.

As an example, imagine a framework that provides very high-level tools, but they are limited in the ways they can be used. Perhaps a fully-featured inheritance system exists, but lots of configuration and boilerplate is required to create a minimal environment. Such a feature would be considered powerful but not elegant. An example of this is PHP's [Laravel](https://github.com/laravel/framework) framework.

In contrast, a program could be elegant but not very powerful. Imagine a framework that provides a composable plugin system, but does not provide any other high-level features for writing HTTP services. Such a system would be elegant but not powerful—many complex tasks would need to be writen by hand. An example of this is Node.js's [Connect](https://github.com/senchalabs/connect) framework.

Koa and Vapr attempt to be both powerful and elegant, and both are quite successful at it when compared to existing alternatives within the Node.js ecosystem. For the rest of this section, we'll dive deeply into some examples of how they compare and contrast within these criteria.

### 1.2. Plugin system

In contrast with most other HTTP frameworks, Koa and Vapr provide something much more powerful than a traditional *[connect-style](https://github.com/senchalabs/connect)* plugin system. The traditional system relies on passing control to so-called *next* functions which are provided as a parameter to each plugin. Each plugin typically performs its duty by mutating the *request* and/or *response* objects, followed by invoking *next* when it's finished. If a plugin wishes to respond to the request, it invokes a method similar to *[response.end](https://nodejs.org/api/http.html#http_response_end_data_encoding_callback)*, and simply does not invoke *next*. The problems with the *connect-style* system are equal to the problems of callback-passing in general (also called *continuation-passing*), which is a [well-studied topic](https://medium.com/@ejpbruel/the-drawbacks-of-callbacks-or-why-promises-are-great-5dedf2c98c67) and is universally regarded as bug-prone and inelegant. Fragile error handling, [inversion of control](https://en.wikipedia.org/wiki/Halting_problem), and the lack of composability are just a few of the many problems that make callback-passing unsuitable for dealing with asynchronicity in reasonably complex programs.

Recent versions of JavaScript are lucky enough to have [promises](https://javascript.info/promise-basics) and [async functions](https://javascript.info/async-await). Koa and Vapr plugins can be async functions, abandoning the use of callback-passing. The benefits of this are equal to the benefits of promises and async functions in general. The result is more expressive, less bug-prone code, and much greater elegance as the complexity of a program grows. Examples and evidence of this are easily searchable, so we choose not to dedicate any more time to the subject.

Another major feature of both Koa and Vapr is the use of stack-like flow control. The major departure from the *connect-style* system is that when the main route logic is done, control will start flowing in the reverse direction, "unwinding" the plugins (like unwinding a stack). This allows plugins to easily perform operations after a response is ready, but before it's sent to the client. Use-cases include setting response headers, compressing a response stream, sanitization, round-trip logging, measuring latency, caching, and many more features that would be awkward or unreliable in a *connect-style* system. For the sake of futher discussion, any logic performed while unwinding the *plugin stack* will be called *late logic*.

Despite their similarities, Koa and Vapr each have important differences in their plugin systems. Koa implements *late logic* through the use of async functions, while Vapr utilizes [higher-order plugins](https://en.wikipedia.org/wiki/Higher-order_function) that return *[late handlers](https://github.com/JoshuaWise/vapr#functional-middleware)*. Both implementations result in similar levels of elegance, but we argue that higher-order plugins are the more powerful solution.

```js
// Late logic in Koa (async functions)
route.use(async (ctx, next) => {
  await next();
  ctx.response.set('X-Some-Header', 'foo');
});

// Late logic in Vapr (higher-order plugins)
route.use(req => res => {
  res.headers.set('X-Some-Header', 'foo');
});
```

To show the power of higher-order plugins, we must first reveal the problem with using async functions for late logic. The problem lies in the handling of expected and unexpected errors.

When an exception occurs in Koa, the *next* function will return a rejected promise with whatever value was thrown (typically an [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object). This makes it very easy to catch the error (via a *try-catch* statement or the [catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch) method) and handle it appropriately (typically by logging the error and setting the response status to *500*). In fact, doing such a thing is so common that if you don't do it manually, Koa will do it for you automatically.

While this looks great in trivial examples, it falls apart in complex programs. Imagine that you set some response header in anticipation of a successful response, only to experience an unexpected error afterwards. Should that header be included in error responses too? If not, you'll have to manually remove them in your error handler (we'll call this *rollback logic*). In fact, your error handler must be aware of every possible thing that your application could do to the response object, *and* it must be aware of whether or not each of those mutations are valid for all responses or only for successful responses. In the extreme case, your error handler must be a decomposition of your entire application. This becomes very fragile (and unwieldy) in sufficiently complex programs.

The problem of rollback logic is just as apparent in the case of *expected errors*. It's common for programs to have conditional statements guarding against invalid requests or anticipated points of error. For example, if an invalid query parameter is provided, an appropriate reaction would be to send a *400 Bad Request* response. In Koa, to send an early response, a plugin simply does not invoke the *next* function (just as in a traditional callback-passing system). In this case though, no exception is thrown, so the error handler will have to implement the rollback logic for both exceptional and unexceptional cases. It should also be mentioned that most plugins which execute late logic (after the expected error is generated) will need check the status code before continuing to operate; this in particular is a required pattern in Vapr as well, but we note that Koa does not escape this requirement.

By now, the clever reader might have deduced that the issue is not with async functions themselves, but with a shared, irreplaceable response object. When a condition occurs that changes the status of a response (e.g., from a success to a failure), the existing response object, which was meticulously crafted for a successful response, is no longer valid. All previous work should be discarded, and an entirely new response object should be used in its place to represent the error. This is exactly what some frameworks currently do, such as [Restify](https://github.com/restify/node-restify). Unfortunately, Restify lacks the concept of *late logic*, and is therefore unable to customize the error response further. The issue of maintaning a valid state for the response object at all times is analogous to the usage of mutable global variables.

Through the use of higher-order plugins, Vapr solves the problem elegantly and powerfully. Each *late handler* receives its own response object as a parameter. In the case of an anticipated error, a plugin can return a new response which replaces the existing one for subsequent late handlers—no rollback logic is necessary. For unexpected errors, a response object is automatically generated with a 500 status code, exposing the original Error object as a read-only property of itself. Unlike in Koa, no late logic is skipped due to exceptions being thrown. If a plugin is only interested in successful responses (or if it is only interested in error responses), it can simply check the status code before operating (which is a requirement in Koa too, as noted previously).

Most response headers are tied to other aspects of the response—examples include Content-Type, Content-Encoding, Location, Trailer, etc. However, in some cases a response header should be set regardless of outcome, such as the Server header. In the latter case, the header can simply be applied within the error handler or afterwards. In summary, if the header is related to data within the response, it's correct to discard the header when the status of the response changes; if the header is *unrelated* to the response, it can be applied regardless of whether the original response object was previously replaced or not. This is exactly what the Vapr plugin system allows you to do—with no extra effort on the programmer—regardless of program complexity.

### 1.3 Program Structure

Koa and Vapr take two different approaches when it comes to program structure. A Koa application is structured as a *tree* of plugins. One plugin might perform a mutation to the response object, while another plugin might route the request into a nested *sub-tree* of plugins to be processed further ([Connect](https://github.com/senchalabs/connect) and [Express](https://github.com/expressjs/express) behave this way too). A Vapr application is composed of a top-level router which has a flat list of routes, where each route has its own, complete, encapsulated list of plugins.

The hallmark of Koa's system is its ability to have nested, cascading trees of plugins, facilitating the creation of *groups* of routes which all share some common plugins. Let's use the example of `/articles/:id` and `/articles/:id/render`. It may seem intuitive (and indeed likely) that any sub-route of `/articles/:id` needs to retrieve the selected article from a database. Rather than including that logic in every sub-route, it's standard to include it as a plugin before the `/articles/:id` sub-router. This way, when the route handler for `/articles/:id/render` is invoked, the relevant article will have already been retrieved.

At first glance, the structure of Koa may seem quite elegant; the Vapr structure looks a bit rigid. But further investigation reveals that Vapr's flattened structure is nearly identical in power, but far more scalable. Koa's nested structure suffers from the same problems as any inheritance system. In recent years, programming languages have [shifted away](https://en.wikipedia.org/wiki/Composition_over_inheritance) from systems based on inheritance towards systems to based on composition. The realization is that inheritance trees are frequently imperfect, and this realization is never more true than in the case of route construction.

Going deeper into the previous example, let's imagine that a new route is created called `/articles/:id/delete`. Deleting the article does not require retrieving it, but it's being retrieved anyways. The obvious solution is to split the `/articles/:id` sub-router into two; one where the article is retrieved, one where it isn't. However, if this plugin sharing goes unnoticed (which it often does in large programs), incorrect and often arbitrary logic will leak into unsuspecting places. It's obvious to see that as program complexity grows, this inheritance system is not sustainable. Therefore, Vapr chooses the principle of composition instead of inheritance.

In Vapr, routes are *encapsulated* from other routes. No route inherits from another, and any shared plugins are declared explicitly. The result is that each route has its own complete set of plugins, and changing one route will never affect another route. To avoid verbosity and to enable easy composition, the *use* method in Vapr can accept any number of functions or arrays of functions (and any depth of nested arrays). The plugin lists are flattened at startup time, to avoid unnecessary overhead.

```js
const commonPlugins = [plugin1(), plugin2()];
route.use(commonPlugins, plugin3());
route.use(plugin4());
```

As seen above, you can still have the power of reusable logic, but everything is explicitly declared, rather than having a waterfall of plugins being applied implicitly based on the route's position relative to other routes.

### 1.4. Routing

Technically speaking, Koa does not have a built-in router. However, many consider [koa-router](https://github.com/alexmingoia/koa-router) to be Koa's defacto router (although written by a different author). Therefore, for the remainder of the study we'll consider koa-router to be Koa's router.

It's worth discussing the implications of implementing Koa's router as a separate plugin, rather than as part of the framework. For one, it allows plugins to be inserted before any routing takes place. This grants extra flexibility, but is in direct opposition with Vapr's concept of *route encapsulation* ([section 1.3](#13-program-structure)); a trade-off was made. Furthermore, if for some reason there were logic that truly needed to be executed before routing, it could be implemented by wrapping the Vapr app within another function (because a Vapr app is really just a configurable function), although this is not recommended. Such is normal practice elsewhere within JavaScript applications.

A common theme exists between how Koa handles plugins and how it handles routes: both are dictated by *declaration order*. As routes are declared, their defining pathnames (e.g., `/articles/:id`) are converted into [regular expressions](https://en.wikipedia.org/wiki/Regular_expression), and each route is concatenated into a list. When a request is made, the list is scanned linearly until an expression is matched, at which point the request is routed into the associated nested plugin tree ([section 1.3](#13-program-structure)).

In complex programs it's not abnormal to have multiple routes which could be matched from the same request URI. In this case, the "winning" route is simply whichever one was defined first. One could imagine performing the innocent action of changing the import order of modules (perhaps due to new [linting rules](https://eslint.org/)), only to find that the behavior of the HTTP service has changed as a result. This behavior is practically never desirable.

An alternative, more simple solutions exists. In Vapr, routing is performed via a single hash lookup. Parameterized routes (e.g., `/:id`) are implemented by [radix tree](https://en.wikipedia.org/wiki/Radix_tree) lookup. Besides the  performance benefits of this approach ([section 4.1](#42-scaling-a-router)), it also creates an environment where routes are matched deterministically, independent of declaration order. While technically this is a *decrease* in power, we believe it's a power that most programmers don't want to deal with. The result is an increase in elegance for complex programs.

### 1.5. Asynchronous interface

Node.js is a heavily asynchronous, event loop-driven environment. Asynchronous programming is especially relevant within the context of an HTTP service, since many connections must be managed concurrently. In [section 1.2](#12-plugin-system) we did a cursory overview of common asynchronous strategies. In particular, we made a distinction between low-level *callbacks* and high-level *promises*. However, different strategies exist for solving different problems. Promises and callbacks are typically designed to solve the problem of representing a *single* future event. On the other hand, Node.js also has *[event emitters](https://nodejs.org/api/events.html)* and *[streams](https://nodejs.org/api/stream.html)* which are both designed to solve the problem of representing *multiple* future events. An analogy in synchronous programming is the distinction between a *single value* and an *iterator* or *array*.

There is also a distinction between the nature of [event emitters](https://nodejs.org/api/events.html) and [streams](https://nodejs.org/api/stream.html). The former is called a *broadcaster*, in that it does not care who is subscribed to it, it simply broadcasts events as they occur. When using a broadcaster, there's no way of guaranteeing that the events received are a complete representation of the system, or just a partial representation (typically because the subscriber started listening for events after some were already emitted). Within the context of an HTTP framework for example, this can happen if two different plugins try to read the request body, but the second plugin is executed at a later point in time than the first.

There are some situations where using a broadcaster is appropriate, but the case of representing an HTTP request body is not one of those situations. The request body is practically meaningless (and probably invalid from a syntactic point of view) if it's not reliably received in its entirety. To solve this difficult problem, organizations such as [WHATWG](https://streams.spec.whatwg.org/) and [Dart](https://www.dartlang.org/tutorials/language/streams#single-subscription-streams) have developed higher-level paradigms that achieve reliability by only allowing a single subscriber, buffering events until the subscription is created (we'll call these *SS devices*, meaning single-subscriber). Since Node.js's [streams](https://nodejs.org/api/stream.html) are meant to be used this way (despite actually allowing multiple subscribers), we'll also call them SS devices.

In contrast with broadcasters, which emit arbitrary event types, SS devices typically only emit a few specific event types—*data*, *end*, and *error*. Another point of contrast is that SS devices are able to buffer their own events, allowing the programmer to be more flexible about when the data is consumed. This already grants a significant increase in power when compared to the broadcaster—but we can go further.

All previously mentioned SS devices—except Node.js streams—implement error propagation. Error propagation is the property that if one device in a chain encounters an error, the entire chain will be destroyed, preventing a memory leak. Promises have a similar behavior (despite not needing to manage resource handles, being single events), which is one of the primary reasons they're desired over callbacks. Node.js streams can be piped together, but they do not exhibit error propagation.

Another feature exhibited by the SS devices—again, except Node.js streams—is backward cancellation. This is the property that if a subscriber is no longer interested in the event stream, it can destroy upstream (source) devices, preventing unnecessary resource usage.

As we dive deeper, we draw yet another distinction among paradigms—this time within the family of SS devices. One group contains [WHATWG streams](https://streams.spec.whatwg.org/) and [Node.js streams](https://nodejs.org/api/stream.html), while the other contains [Dart streams](https://www.dartlang.org/tutorials/language/streams#single-subscription-streams). The former group is mostly concerned with representing streams of octets, and is not so concerned with the general case (despite supporting "object streaming" in a rudimentary sense). The latter group is very concerned with the general case of streaming any type of event, and is equally capable of representing streams of octets. Dart streams do not sacrifice any elegance or power in exchange for general purpose use. Any desirable behavior utilized by the former group (such as counting bytes, rather than objects) can be reimplemented in a system that supports the general case.

Being general purpose, Dart streams implement many high-level methods for transforming event streams in various ways. For example, there are methods analogous to familiar [array methods](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) such as *map*, *filter*, *reduce*, and *find*, but also methods that only become relevant in the asynchronous context such as *timeout*. The less elegant Node.js streams and WHATWG streams require many complex lines of code to accomplish the same simple tasks.

```js
// Parsing a JSON request body (with Node.js streams)
function parse(body) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    body.on('data', (chunk) => {
      chunks.push(chunk);
    });
    body.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks)));
      } catch (err) {
        reject(err);
      }
    });
    body.on('error', reject);
    body.on('aborted', () => {
      reject(new Error('The request was aborted'));
    });
  });
}
```

```dart
// Parsing a JSON request body (with Dart streams)
dynamic parse(Stream<Uint8List> body) async {
  return body
    .map((chunk) => chunk.toList())
    .reduce(concat)
    .then((list) => JSON.decode(UTF8.decode(list)))
}
```

Perhaps the biggest problem with Node.js streams is that they aren't composable with promises. None of the methods or interfaces associated with Node.js streams interact with promises in any way. In fact, programmers are forced to resort to callbacks, or to use the stream like a simple broadcaster. There's an obvious incompatibility when attempting to interweave the two constructs. The same problem does not exist when interweaving their synchronous counterparts; array methods accept single values, arrays can be treated as single values, etc.

Vapr embraces something very similar to a Dart stream. More specifically, it uses a brand of SS device called a *[river](https://github.com/JoshuaWise/wise-river)* (created by the same author as this study). Rivers are an indirect port of Dart streams into the JavaScript ecosystem, with a few design modifications. Rivers are a subclass of promises, meaning they share the same API, and can also be treated as single asynchronous events. As a matter of future-proofing, rivers are also [async iterables](https://github.com/tc39/proposal-async-iteration). Rivers propagate errors, exhibit backward cancellation, and are suitable for events of any type.

```js
// Parsing a JSON request body (with rivers)
function parse(body) {
  return body.all().then(Buffer.concat).then(JSON.parse);
}
```

Koa was written in a time when the usage of high-level asynchronous constructs was not common (at least within the Node.js community). Despite utilizing promises and async functions, Koa uses Node.js streams to represent request and response bodies, resulting in a reduction of both power and elegance.

![Graph of the categorization of relevant asynchronous constructs](./images/async-graph.png)

## 2. Feature Completeness

### 2.1 Defining the criteria

When evaluating the usefulness of a software tool, "feature completeness" is usually a primary concern. This refers to which actions a user of the tool can or cannot perform, typically in a binary sense. Where the previous [section](#1-power-and-elegance) analyzed the *quality* of comparable features between the two frameworks, this section aims to point out any differences in the *existence* of such features.

In closed systems, feature completeness is easily agreed upon and well defined. However, in open systems such as Koa and Vapr, where elegant plugin systems exist, the concept becomes fuzzier and more opinionated. For example, Koa provides [features](https://github.com/koajs/koa/blob/master/docs/api/request.md#content-negotiation) that are generally optional in HTTP services. Someone who uses those features would likely see their inclusion as an example of feature completeness. On the other hand, Vapr only implements features that are truly a necessity, viewing anything else as subject to the opinions of the application author (such features are intentionally left out). In both frameworks, plugins are responsible for implementing opinionated logic, but Vapr is more strict about this principle, which may be seen as a positive or negative thing.

### 2.2 Request representation

In any HTTP framework, information about incomming requests must be readily available to the host application. Both Koa and Vapr provide all of such information, but their approaches on delivery differ. Both frameworks transparently provide things like the [request target](https://tools.ietf.org/html/rfc7230#section-5.3) (also called the "URI"), [route parameters](https://github.com/JoshuaWise/vapr#routing), [headers](https://tools.ietf.org/html/rfc7230#section-3.2), [protocol version](https://tools.ietf.org/html/rfc7230#section-2.6), etc., but Koa takes the additional step of providing methods for interpreting various common headers. As an example, Koa provides [a method](https://github.com/koajs/koa/blob/master/docs/api/request.md#content-negotiation) for reasoning about the meaning of an [Accept](https://tools.ietf.org/html/rfc7231#section-5.3.2) header, should one exist in the request. Vapr provides no such method, relying on plugins to provide such functionality when needed. This is a common theme between the two frameworks but, for completeness, we attempt to list the specific features that Vapr omits (at least, as it is at the time of this writing).

- [`request.length`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestlength): the Content-Length header parsed as a number
- [`request.type`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requesttype): the Content-Type header void of any parameters
- [`request.charset`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestcharset): the "charset" parameter within the Content-Type header
- [`request.query`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestquery): the parsed query string of the URI
- [`request.fresh`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestfresh): an interpretation of request cache freshness, combining logic of various conditional headers such as If-None-Match/ETag and If-Modified-Since/Last-Modified, which only works after certain response headers have been set
- [`request.subdomains`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestsubdomains): the hostname of the request, split into an array by the "." separating character, void of the last two domain labels
- [`request.idempotent`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestidempotent): an indicator of whether the request method is one of GET, HEAD, PUT, DELETE, OPTIONS, or TRACE
- [`request.is()`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestistypes): performs a boolean check for whether the Content-Type header matches one or more patterns
- [`request.accepts()`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestacceptstypes): performs a boolean check for whether the Accept header matches one or more patterns
- [`request.acceptsEncodings()`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestacceptsencodingsencodings): performs a boolean check for whether the Accept-Encoding header matches one or more patterns
- [`request.acceptsCharsets()`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestacceptscharsetscharsets): performs a boolean check for whether the "charset" parameter within the Content-Type header matches one or more patterns
- [`request.acceptsLanguages()`](https://github.com/koajs/koa/blob/master/docs/api/request.md#requestacceptslanguageslangs): performs a boolean check for whether the Accept-Language header matches one or more patterns

Some of these features can be implemented in less than a line of code. For example, `request.length` can be implemented in Vapr as `parseInt(headers.get('Content-Length'))`. Other features here are very opinionated or not flexible, which could cause many application developers to reach for a different (very similar) tool. An example of this is `request.query`, which uses a preconfigured query parser with no way of customization. Imagine you were building a [JSON API](http://jsonapi.org/) service that relies on JSON API's usage of nested query paramters (e.g., `fields[Article]`)—you would need to use a more flexible query parser, being sure to ignore the one built into your underlying framework.

While the lack of these features may seem like an inconvenience to some, Vapr's philosophy is to have no application-specific opinion built into the framework, while making it as easy as possible to impart such opinions when needed. No feature listed above cannot be implemented as a Vapr plugin and, in fact, nearly every feature listed above could potentially be implemented in a variety of ways, depending on the needs of the application.

### 2.3 Response representation

In [section 1.2](#12-plugin-system) we discussed major differences in how Koa and Vapr each deal with response objects. Aside from those differences, differences related to feature completeness also exist (and reflect the same differences in philosophy [already described](#22-request-representation)).

Both Koa and Vapr transparently allow setting the common properties of an HTTP response, such as [status code](https://tools.ietf.org/html/rfc7230#section-3.1.2), [reason phrase](https://tools.ietf.org/html/rfc7230#section-3.1.2) (also called the "status message"), and [headers](https://tools.ietf.org/html/rfc7230#section-3.2). However, Koa does not provide an interface for setting [trailer](https://tools.ietf.org/html/rfc7230#section-4.1.2) fields. For applications that require this functionality, programmers will need to bypass Koa and use core [http](https://nodejs.org/api/http.html) functions. Although trailers are a less commonly used feature of HTTP, the protocol considers them a core feature rather than an extension, so Vapr provides a high-level, promise-based interface for them.

As in the previous section, Koa implements additional tools for setting various common properties of HTTP responses.

- [`.length`](https://github.com/koajs/koa/blob/master/docs/api/response.md#responselength): TODO
- [`.type`](https://github.com/koajs/koa/blob/master/docs/api/response.md#responsetype-1): TODO
- [`.lastModified`](https://github.com/koajs/koa/blob/master/docs/api/response.md#responselastmodified-1): TODO
- [`.etag`](https://github.com/koajs/koa/blob/master/docs/api/response.md#responseetag): TODO
- [`.is()`](https://github.com/koajs/koa/blob/master/docs/api/response.md#responseistypes): TODO
- [`.redirect()`](https://github.com/koajs/koa/blob/master/docs/api/response.md#responseredirecturl-alt): TODO
- [`.attachment()`](https://github.com/koajs/koa/blob/master/docs/api/response.md#responseattachmentfilename): TODO
- [`.vary()`](https://github.com/koajs/koa/blob/master/docs/api/response.md#responsevaryfield): TODO

TODO: body (json)

### 2.4 Routing capabilities

(nested routers; bad)
(virtual hosting)
(regex routes)

## 3. Stability and Robustness

### 3.1 Defining the criteria

### 3.2 Abnormal input

(whitespace in headers)
(aborted requests)
(unnormalized unicode)
(unnormalized percent-encodings)

### 3.3 Invalid input

(invalid url)
(invalid host header)

### 3.4 Unsound program logic

(next is just a function, late handlers are mutually exclusive with responses)
(immutability)
(improper async actions)
(improper response crafting, invalid mutually exclusive response headers)

### 3.5 Dependencies

## 4. Performance

### 4.1 Defining the criteria

### 4.2 Scaling a router

### 4.3 Benchmarking errors

### 4.4 Overall latency
