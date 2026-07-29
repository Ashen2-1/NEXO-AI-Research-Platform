import { useState } from "react";
import "./LoginPage.css";
import { apiRequest } from "../api.js";

function LoginPage() {
    const [authMode, setAuthMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const isSignupMode = authMode === "signup";

    const handleAuthSubmit = async (event) => {
        event.preventDefault();

        setErrorMessage("");

        if (isSignupMode && password.length < 8) {
            setErrorMessage(
                "Password must contain at least 8 characters."
            );
            return;
        }

        if (
            isSignupMode && password !== confirmPassword) {
            setErrorMessage(
                "The two passwords do not match."
            );
            return;
        }

        setIsLoading(true);

        try {
            const endpoint = isSignupMode
                ? "/auth/register"
                : "/auth/login";

            const data = await apiRequest(endpoint, {
                method: "POST",
                skipAuthRedirect: true,
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
            });

            localStorage.setItem("nexo_token", data.token);
            localStorage.setItem(
                "nexo_user",
                JSON.stringify(data.user)
            );

            window.location.assign("/");
        } catch (error) {
            console.error("Authentication error:", error);

            setErrorMessage(
                error.message ||
                (isSignupMode
                    ? "Unable to create your account."
                    : "Unable to sign in.")
            );
        } finally {
            setIsLoading(false);
        }
    };

    const switchAuthMode = () => {
        setAuthMode((currentMode) =>
            currentMode === "login" ? "signup" : "login"
        );

        setPassword("");
        setErrorMessage("");
        setConfirmPassword("");
    };

    return (
        <div className="Login_Page">
            <form
                className="Login_Card"
                onSubmit={handleAuthSubmit}
            >
                <p className="Login_Brand">NEXO</p>

                <h1>
                    {isSignupMode ? "Create account" : "Sign in"}
                </h1>

                <p className="Login_Subtitle">
                    {isSignupMode
                        ? "Create your NEXO research workspace"
                        : "Enter your credentials to continue"}
                </p>

                <label className="Login_Label">
                    EMAIL
                </label>

                <input
                    className="Login_Input"
                    type="email"
                    value={email}
                    onChange={(event) =>
                        setEmail(event.target.value)
                    }
                    autoComplete="email"
                    required
                />

                <label className="Login_Label">
                    PASSWORD
                </label>

                <input
                    className="Login_Input"
                    type="password"
                    value={password}
                    onChange={(event) =>
                        setPassword(event.target.value)
                    }
                    autoComplete={
                        isSignupMode
                            ? "new-password"
                            : "current-password"
                    }
                    minLength={isSignupMode ? 8 : 1}
                    required
                />

                {isSignupMode && (
                    <>
                        <p className="Login_Password_Hint">
                            Use at least 8 characters.
                        </p>

                        <label className="Login_Label">
                            CONFIRM PASSWORD
                        </label>

                        <input
                            className="Login_Input"
                            type="password"
                            value={confirmPassword}
                            onChange={(event) =>
                                setConfirmPassword(event.target.value)
                            }
                            autoComplete="new-password"
                            minLength={8}
                            required
                        />
                    </>
                )}

                {errorMessage && (
                    <p className="Login_Error_Message">
                        {errorMessage}
                    </p>
                )}

                <button
                    className="Login_Continue_Button"
                    type="submit"
                    disabled={isLoading}
                >
                    {isLoading
                        ? isSignupMode
                            ? "CREATING ACCOUNT..."
                            : "SIGNING IN..."
                        : isSignupMode
                            ? "CREATE ACCOUNT"
                            : "CONTINUE"}
                </button>

                <p className="Login_Signup_Text">
                    {isSignupMode
                        ? "Already have an account? "
                        : "No account? "}

                    <button
                        type="button"
                        onClick={switchAuthMode}
                        disabled={isLoading}
                    >
                        {isSignupMode
                            ? "Sign in"
                            : "Sign up"}
                    </button>
                </p>
            </form>
        </div>
    );
}

export default LoginPage;