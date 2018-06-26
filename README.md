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

Each section has associated code examples within the [cases](./cases/) directory. Some of these examples are executable via scripts found within the [package.json](./package.json) file.

## 1. Power and Elegance

### 1.1. Defining the criteria

Programs are often described in terms of varying "power" and "elegance". The former refers to how easy it is to correctly perform complex tasks, where generally fewer lines of code equates to greater power. The latters refers to the intuitiveness of turning simple programs into more complex ones, where requiring fewer changes and fewer new concepts equates to greater elegance. The two properties are closely related, but independent of each other.

As an example, imagine a framework that provides very high-level tools, but they are limited in the ways they can be used. Perhaps a fully-featured inheritance system exists, but lots of configuration and boilerplate is required to create a minimal environment. Such a feature would be considered powerful but not elegant. An example of this is PHP's [Laravel](https://github.com/laravel/framework) framework.

In contrast, a program could be elegant but not very powerful. Imagine a framework that provides a composable plugin system, but does not provide any other high-level features for writing HTTP services. Such a system would be elegant but not powerful—many complex tasks would need to be writen by hand. An example of this is Node.js's [Connect](https://github.com/senchalabs/connect) framework.

Koa and Vapr attempt to be both powerful and elegant, and both are quite successful at it when compared to existing alternatives within the Node.js ecosystem. For the rest of this section, we'll dive deeply into some examples of how they compare and contrast within these criteria.

### 1.2. Plugin system

In contrast with most other HTTP frameworks, Koa and Vapr provide something much more powerful than a traditional *[connect-style](https://github.com/senchalabs/connect)* plugin system. The traditional system relies on passing control to so-called *next* functions which are provided as a parameter to each plugin. Each plugin typically performs its duty by mutating the *request* and/or *response* objects, followed by invoking *next* when it's finished. If a plugin wishes to respond to the request, it invokes a method similar to *[response.end](https://nodejs.org/api/http.html#http_response_end_data_encoding_callback)*, and simply does not invoke *next*. The problems with the *connect-style* system are equal to the problems of callback-passing in general (also called *continuation-passing*), which is a [well-studied topic](https://medium.com/@ejpbruel/the-drawbacks-of-callbacks-or-why-promises-are-great-5dedf2c98c67) and is universally regarded as bug-prone and inelegant. Fragile error handling, [undesired inversion of control](https://en.wikipedia.org/wiki/Halting_problem), and the lack of composability are just a few of the many problems that make callback-passing unsuitable for dealing with asynchronicity in reasonably complex programs.

Recent versions of JavaScript are lucky enough to have [Promises](https://javascript.info/promise-basics) and [async functions](https://javascript.info/async-await). Koa and Vapr plugins can be async functions, abandoning the use of callback-passing. The benefits of this are equal to the benefits of promises and async functions in general. The result is more expressive, less bug-prone code, and much greater elegance as the complexity of a program grows. Examples and evidence of this are easily searchable, so we choose not to dedicate any more time to the subject.

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

When an exception occurs in Koa, the *next* function will return a rejected Promise with whatever value was thrown (typically an [Error](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) object). This makes it very easy to catch the error (via a *try-catch* statement or the [catch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch) method) and handle it appropriately (typically by logging the error and setting the response status to *500*). In fact, doing such a thing is so common that if you don't do it manually, Koa will do it for you automatically.

While this looks great in trivial examples, it falls apart in complex programs. Imagine that you set some response header in anticipation of a successful response, only to experience an unexpected error afterwards. Should that header be included in error responses too? If not, you'll have to manually remove them in your error handler (we'll call this *rollback logic*). In fact, your error handler must be aware of every possible thing that your application could do to the response object, *and* it must be aware of whether or not each of those mutations are valid for all responses or only for successful responses. In the extreme case, your error handler must be a decomposition of your entire application. This becomes very fragile (and unwieldy) in sufficiently complex programs.

The problem of rollback logic is just as apparent in the case of *expected errors*. It's common for programs to have conditional statements guarding against invalid requests or anticipated points of error. For example, if an invalid query parameter is provided, an appropriate reaction would be to send a *400 Bad Request* response. In Koa, to send an early response, a plugin simply does not invoke the *next* function (just as in a traditional callback-passing system). In this case though, no exception is thrown, so the error handler will have to implement the rollback logic for both exceptional and unexceptional cases. It should also be mentioned that most plugins which execute late logic (after the expected error is generated) will need check the status code before continuing to operate; this in particular is a required pattern in Vapr as well, but we note that Koa does not escape this requirement.

By now, the clever reader might have deduced that the issue is not really with async functions, but with a shared, irreplaceable response object. When a condition occurs that changes the status of a response (e.g., from a success to a failure), the existing response object, which was meticulously crafted for a successful response, is no longer valid. All previous work should be discarded, and an entirely new response object should be used in its place to represent the error. This is exactly what some frameworks currently do, such as [Restify](https://github.com/restify/node-restify). Unfortunately, Restify lacks the concept of *late logic*, and is therefore unable to customize the error response further.

Through the use of higher-order plugins, Vapr solves the problem elegantly and powerfully. Each *late handler* receives its own response object as a parameter. In the case of an anticipated error, a plugin can return a new response which replaces the existing one for subsequent late handlers—no rollback logic is necessary. For unexpected errors, a response object is automatically generated with a 500 status code, exposing the original Error object as a read-only property of itself. Unlike in Koa, no late logic is skipped due to exceptions being thrown. If a plugin is only interested in successful responses (or if it is only interested in error responses), it can simply check the status code before operating (which is a requirement in Koa too, as noted previously).

Most response headers are tied to other aspects of the response—examples include Content-Type, Content-Encoding, Location, Trailer, etc. However, in some cases a response header should be set regardless of outcome, such as the Server header. In the latter case, the header can simply be applied within the error handler or afterwards. In other words, if the header is related to data within the response, it's correct to discard the header when the status of the response changes; if the header is *unrelated* to the response, it can be applied regardless of whether the original response object was previously discarded or not. This is exactly what the Vapr plugin system allows you to do—with no extra effort on the programmer—regardless of program complexity.

### 1.3. Routing

Technically speaking, Koa does not have a built-in router. However, many consider [koa-router](https://github.com/alexmingoia/koa-router) to be Koa's defacto router (although written by a different author). Therefore, for the rest of this study we'll consider koa-router to be Koa's router.

It's worth discussing the implications of implementing Koa's router as a separate plugin, rather than as part of the framework. For one, it allows "universal" plugins to be inserted before any routing takes place. This grants extra flexibility on the surface, but is in direct opposition with Vapr's concept of *route encapsulation* ([section 1.2](#12-plugin-system)). Furthermore, if for some reason there were logic that truly needed to be executed before routing, it could be implemented by wrapping the Vapr app within another function (because a Vapr app is really just a configurable function). Such is normal practice elsewhere within JavaScript applications.

(TODO: write the rest of this section)

### 1.4. Responding to requests

### 1.5. Asynchronous interface

## 2. Feature Completeness

## 3. Stability and Robustness

## 4. Performance

