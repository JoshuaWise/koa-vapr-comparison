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

### Defining the criteria

Programs are often described in terms of varying "power" and "elegance". The former refers to how easy it is to correctly perform complex tasks, where generally fewer lines of code equates to greater power. The latters refers to the intuitiveness of turning simple programs into more complex ones, where requiring fewer changes and fewer new concepts equates to greater elegance. The two properties are closely related, but independent of each other.

As an example, imagine a framework that provides very high-level tools, but they are limited in the ways they can be used. Perhaps a full-featured inheritance system exists, but lots of configuration and boilerplate is required to create a minimal environment. Such a feature would be considered powerful but not elegant. An example of this is PHP's [Laravel](https://github.com/laravel/framework) framework.

In contrast, a program could be elegant but not very powerful. Imagine a framework that provided a composable plugin system, but did not provide any other high-level features for writing HTTP services. Such a system would be elegant but not powerful—many complex tasks would need to be writen by hand. An example of this is Node.js's [Connect](https://github.com/senchalabs/connect) framework.

Koa and Vapr attempt to be both powerful and elegant, and both are quite successful at it when compared to existing alternatives within the Node.js ecosystem. For the rest of this section, we'll dive deeply into some examples of how they compare and contrast within these criteria.

### Routing

### Responding to requests

### Plugin system

### Asynchronous interface

## 2. Feature Completeness

## 3. Stability and Robustness

## 4. Performance

