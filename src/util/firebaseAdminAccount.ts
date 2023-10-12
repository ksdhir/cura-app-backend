//  a function firebase that returns config for admin account from env file

const firebaseAdminAccount: () => Record<string, any> = () => {
  return {
    type: process.env.FirebaseAdmin_type,
    project_id: process.env.FirebaseAdmin_project_id,
    private_key_id: process.env.FirebaseAdmin_private_key_id,
    private_key: process.env.FirebaseAdmin_private_key,
    client_email: process.env.FirebaseAdmin_client_email,
    client_id: process.env.FirebaseAdmin_client_id,
    auth_uri: process.env.FirebaseAdmin_auth_uri,
    token_uri: process.env.FirebaseAdmin_token_uri,
    auth_provider_x509_cert_url:
      process.env.FirebaseAdmin_auth_provider_x509_cert_url,
    client_x509_cert_url: process.env.FirebaseAdmin_client_x509_cert_url,
    universe_domain: process.env.FirebaseAdmin_universe_domain,
  };
};

export default firebaseAdminAccount;
