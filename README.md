<h1 align="center">
  <img src="images/svelte_keycloak.png" alt="Svelte + Keycloak Auth Flow" width="500"/>
  <br/>
  🔒Svelte + Keycloak Custom Onboarding Template 🔓
</h1>
<h3 align="center">
  End-to-end authentication and onboarding flow using <b>Keycloak</b> for identity management and <b>Svelte</b> for a reactive front end.
</h3>
<p align="center">
  <img width="1305" height="715" alt="image" src="https://github.com/user-attachments/assets/3087d0f5-89f5-4b57-b85f-5522b225761d" />

</p>

## 📝 About

This repository demonstrates how to **replace Keycloak’s built-in login UI with a custom onboarding and authentication flow** implemented in **Svelte**, while still using **Keycloak** as the identity provider and token service.

Instead of redirecting users to Keycloak’s hosted login page, this project adds an abstraction layer that lets you present branded, multi-step onboarding and custom sign-in/sign-up forms inside your app. Authentication and token management are handled via the official [`keycloak-js`](https://www.npmjs.com/package/keycloak-js) adapter.
