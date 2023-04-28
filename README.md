The content below is an example project proposal / requirements document. Replace the text below the lines marked "__TODO__" with details specific to your project. Remove the "TODO" lines.

# Khaani

## Overview

Tring to cook your next deshi meal may be difficult, especially when the ingredients that you need aren't accessible in the supermarkets near you. Most of the time these places don't have deshi recipe ingredients in stock. How can you work around this? Try Khaani, a web application that allows customers to buy deshi food items and ingredients from ethnic grocery stores and/or supermarkets that have signed up with Khaani, and you can get those delivered to your doorstep!


## Data Model

This application will store Customers, Stores, and Orders.

* customers can have multiple orders (via references)
* each store can have multiple items (by embedding)

An Example Customer:

```javascript
{
  email: "test@gmail.com",
  hash: // a password hash,
  orders: // an array of references to Order documents
}
```

An Example Store with Embedded Items:

```javascript
{
  storeId: // a unique identifier for a store registered into the platform
  name: "Patel Brothers",
  items: [
    { name: "chicken masala", quantity: "9876"},
    { name: "ghee", quantity: "2"},
  ],
}
```


## [Link to Commented First Draft Schema](db.mjs) 

## [Screenshot of Unit Tests](documentation/Screenshot%202023-04-28%20at%2010.39.13%20AM.png)


## [Wireframes](documentation/IMG_0671.jpg)


## [Site map](documentation/IMG_0670.jpg)

Here's a [complex example from wikipedia](https://upload.wikimedia.org/wikipedia/commons/2/20/Sitemap_google.jpg), but you can create one without the screenshots, drop shadows, etc. ... just names of pages and where they flow to.

## User Stories or Use Cases

1. as non-registered user, I can register a new account with the site
2. as a customer, I can log in to the application
3. as a customer, I can create a store
4. as a user with a store, I can add items to my store
5. as a customer, I can purchase items from a store in the application
6. as a customer, I can search for items
7. as a user with a store, I can receive payments from customers

## Research Topics

* (3 points) Unit testing
    * I'm going to use mocha for unit testing with stubs from sinon
* (6 points) Next.js
    * used Next.js as the frontend framework; it's a challenging library to learn and incorporate, so I've assigned it 6 points.
* (1 points) Stripe.js
    * used Stripe.js to handle payments from customers. I will assign 1 point to this.

10 points total out of 10 required points 


## [Link to Initial Main Project File](app.mjs) 


## Annotations / References Used

1. [tutorial on next.js](https://nextjs.org/docs)
2. [stripe tutorial](https://stripe.com/docs/js)
3. [mocha](https://mochajs.org/)
4. [sinon](https://sinonjs.org/releases/latest/stubs/)

