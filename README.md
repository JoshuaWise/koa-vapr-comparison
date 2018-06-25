# koa-vapr-comparison

This is an opinionated study into the theory and practice of Koa and Vapr as competing HTTP frameworks.

## Background

Throughout the Node.js ecosystem, there exist many popular frameworks for building HTTP-based services. Some of these frameworks are very tailored towards specific use cases, and are not appropriate for the general case. Others, which are usually the most popular ones, are very general and may be applied to almost any HTTP-related task (aside from proxy servers, which are beyond the scope of this study). Notable examples include [Express](https://github.com/expressjs/express), [Restify](https://github.com/restify/node-restify), [Fastify](https://github.com/fastify/fastify), [Hapi](https://github.com/hapijs/hapi), and [Koa](https://github.com/koajs/koa). Adding to that list, [Vapr](https://github.com/JoshuaWise/vapr) is a new generic HTTP framework (created by the same author as this study). In particular, Koa and Vapr are of heightened interest. Both of these frameworks have similar capabilities, share similar design principles, and, by the opinions of this author, are the most advanced in terms of providing high-level functionality in exchange for minimal code use. Perhaps the most important quality though, is that both Koa and Vapr are the least opinionated of these frameworks (in the context of an HTTP framework, being "opinionated" is defined by providing features related to specific application use cases, rather than just matters relevant to the HTTP procotol). Although a more complete study would include all of the aforementioned frameworks, for the reasons just stated we will only focus on comparing Koa and Vapr.

The goal of this study is to convince readers that Vapr is the superior foundation for building generic HTTP services in Node.js. Despite this goal, we are careful not to ignore important spots where Koa may be superior. Some of such cases may be due to diverging priorities or intentional trade-offs. We will compare in terms of both theory and practice. There will be talk of design philosophy and "elegance", but also of relevant examples of performance and stability benchmarks.

## Overview

This study is broken into four main sections.

1. Power and Elegance
2. Feature Completeness
3. Stability and Robustness
4. Performance

Each section has associated code examples within the [cases](./cases/) directory. Some of these examples are executable via scripts found within the [package.json](./package.json) file.

## 1. Power and Elegance

(TODO)

## 2. Feature Completeness

(TODO)

## 3. Stability and Robustness

(TBD)

## 4. Performance

(TBD)
