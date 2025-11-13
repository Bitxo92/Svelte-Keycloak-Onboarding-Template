import Keycloak from "keycloak-js";

//this file creates and initializes the keycloak js client instance using the oficial keycloak-js adapter
//Defines how our app should connect to the keycloak server
//Note: We don't use keycloak.init() because it doesn't work properly with SSO.
//Token management is handled manually via the token endpoint

export const KEYCLOAK_CONFIG = {
  url: "http://localhost:8090/", //base URL -> only for development change in prod
  realm: "main-realm",
  clientId: "app",
};

export const keycloak = new Keycloak(KEYCLOAK_CONFIG); // keycloak client instantiation which serves as main interface for managing everything keycloak-token related

export default keycloak;
