<h1 align="center">
  <img src="images/svelte_keycloak.png" alt="Svelte + Keycloak Auth Flow" width="500"/>
  <br/>
  🔒Svelte + Keycloak Custom Onboarding Template 🔓
</h1>
<h3 align="center">
  End-to-end authentication and onboarding flow using <b>Keycloak</b> for identity management and <b>Svelte</b> for a reactive front end.
</h3>
<p align="center">
  <img width="1076" height="579" alt="image" src="https://github.com/user-attachments/assets/1f2b1ed8-95c7-4daa-8e2c-374005814c51" />
</p>

## 📝 About

This repository demonstrates how to **replace Keycloak’s built-in login UI with a custom onboarding and authentication flow** implemented in **Svelte**, while still using **Keycloak** as the identity provider and token service.

Instead of redirecting users to Keycloak’s hosted login page, this project adds an abstraction layer that lets you present branded, multi-step onboarding and custom sign-in/sign-up forms inside your app. Authentication and token management are handled via the official [`keycloak-js`](https://www.npmjs.com/package/keycloak-js) adapter.
