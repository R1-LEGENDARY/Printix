import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";

function GoogleAuthButton({ onSuccess, onError, action = "log in" }) {
  const buttonRef = useRef(null);
  const [buttonWidth, setButtonWidth] = useState(400);

  useEffect(() => {
    const buttonContainer = buttonRef.current;
    if (!buttonContainer) return undefined;

    function updateButtonWidth() {
      setButtonWidth(Math.min(400, Math.round(buttonContainer.clientWidth)));
    }

    updateButtonWidth();
    const observer = new ResizeObserver(updateButtonWidth);
    observer.observe(buttonContainer);
    return () => observer.disconnect();
  }, []);

  if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) return null;

  return (
    <div className="google-auth-button">
      <div className="auth-social-divider" aria-hidden="true">
        <span>Or {action} with</span>
      </div>
      <div ref={buttonRef} className="google-auth-button__control">
        <GoogleLogin
          onSuccess={onSuccess}
          onError={onError}
          useOneTap={false}
          text="continue_with"
          shape="rectangular"
          width={String(buttonWidth)}
        />
      </div>
    </div>
  );
}

export default GoogleAuthButton;
