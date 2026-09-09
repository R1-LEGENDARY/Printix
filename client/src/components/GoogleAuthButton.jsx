import { GoogleLogin } from "@react-oauth/google";

function GoogleAuthButton({ onSuccess, onError, action = "log in" }) {
  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="google-auth-button">
      <div className="auth-social-divider" aria-hidden="true">
        <span>Or {action} with</span>
      </div>
      <GoogleLogin
        onSuccess={onSuccess}
        onError={onError}
        useOneTap={false}
        text="continue_with"
        shape="rectangular"
        width="400"
      />
    </div>
  );
}

export default GoogleAuthButton;
