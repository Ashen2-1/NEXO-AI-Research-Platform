import { useEffect, useRef, useState } from "react";
import "./LoginPage.css";
import { apiRequest, storeAuthSession } from "../api.js";

const REMEMBERED_EMAIL_KEY = "nexo_remembered_email";
const GOOGLE_SCRIPT_ID = "google-identity-services";

function LoginPage() {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";

    const [authMode, setAuthMode] = useState("login");
    const [email, setEmail] = useState(rememberedEmail);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const googleButtonRef = useRef(null);
    const rememberMeRef = useRef(rememberMe);
    const emailRef = useRef(email);

    const isSignupMode = authMode === "signup";
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

    useEffect(() => {
        rememberMeRef.current = rememberMe;
        emailRef.current = email;
    }, [email, rememberMe]);

    const finishAuthentication = (data, shouldRemember, accountEmail) => {
        storeAuthSession({
            token: data.token,
            user: data.user,
            remember: shouldRemember,
        });

        if (shouldRemember && accountEmail) {
            localStorage.setItem(REMEMBERED_EMAIL_KEY, accountEmail);
        } else {
            localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }

        window.location.assign("/");
    };

    useEffect(() => {
        if (!googleClientId || !googleButtonRef.current) {
            return undefined;
        }

        let cancelled = false;

        const handleGoogleCredential = async (response) => {
            if (!response?.credential || cancelled) {
                return;
            }

            setErrorMessage("");
            setIsGoogleLoading(true);

            try {
                const data = await apiRequest("/auth/google", {
                    method: "POST",
                    skipAuthRedirect: true,
                    body: JSON.stringify({
                        credential: response.credential,
                    }),
                });

                finishAuthentication(
                    data,
                    rememberMeRef.current,
                    data.user?.email || emailRef.current
                );
            } catch (error) {
                setErrorMessage(
                    error.message || "Unable to sign in with Google."
                );
                setIsGoogleLoading(false);
            }
        };

        const renderGoogleButton = () => {
            if (
                cancelled ||
                !window.google?.accounts?.id ||
                !googleButtonRef.current
            ) {
                return;
            }

            const buttonWidth = Math.max(
                240,
                Math.min(
                    384,
                    Math.floor(googleButtonRef.current.getBoundingClientRect().width)
                )
            );

            googleButtonRef.current.replaceChildren();
            window.google.accounts.id.initialize({
                client_id: googleClientId,
                callback: handleGoogleCredential,
            });
            window.google.accounts.id.renderButton(googleButtonRef.current, {
                type: "standard",
                theme: "outline",
                size: "large",
                text: "continue_with",
                shape: "rectangular",
                logo_alignment: "center",
                width: buttonWidth,
            });
        };

        let script = document.getElementById(GOOGLE_SCRIPT_ID);

        if (window.google?.accounts?.id) {
            renderGoogleButton();
        } else if (script) {
            script.addEventListener("load", renderGoogleButton, { once: true });
        } else {
            script = document.createElement("script");
            script.id = GOOGLE_SCRIPT_ID;
            script.src = "https://accounts.google.com/gsi/client";
            script.async = true;
            script.defer = true;
            script.addEventListener("load", renderGoogleButton, { once: true });
            document.head.appendChild(script);
        }

        window.addEventListener("resize", renderGoogleButton);

        return () => {
            cancelled = true;
            window.removeEventListener("resize", renderGoogleButton);
            script?.removeEventListener("load", renderGoogleButton);
        };
    }, [googleClientId]);

    const handleAuthSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage("");

        if (isSignupMode && password.length < 8) {
            setErrorMessage("Password must contain at least 8 characters.");
            return;
        }

        if (isSignupMode && password !== confirmPassword) {
            setErrorMessage("The two passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const endpoint = isSignupMode
                ? "/auth/register"
                : "/auth/login";

            const normalizedEmail = email.trim().toLowerCase();
            const data = await apiRequest(endpoint, {
                method: "POST",
                skipAuthRedirect: true,
                body: JSON.stringify({
                    email: normalizedEmail,
                    password,
                }),
            });

            finishAuthentication(data, rememberMe, normalizedEmail);
        } catch (error) {
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

    const switchAuthMode = (nextMode) => {
        setAuthMode(nextMode);
        setPassword("");
        setConfirmPassword("");
        setErrorMessage("");
    };

    const handleForgotPassword = () => {
        setErrorMessage(
            "Password reset is not available yet. Please contact the NEXO team for help."
        );
    };

    const authenticationBusy = isLoading || isGoogleLoading;

    return (
        <div className="Login_Page">
            <header className="Login_Header">
                <a className="Login_Logo" href="/" aria-label="NEXO home">
                    <strong>NEXO</strong>
                    <span>Share anything visual with clarity and fidelity.</span>
                </a>

                <nav className="Login_Navigation" aria-label="Main navigation">
                    <a href="#features">Collections</a>
                    <a href="#features">Archive</a>
                    <a href="#about">About</a>
                    <button
                        type="button"
                        className="Login_Header_Link"
                        onClick={() => switchAuthMode("login")}
                    >
                        Login
                    </button>
                    <button
                        type="button"
                        className="Login_Header_Cta"
                        onClick={() => switchAuthMode("signup")}
                    >
                        Sign Up
                    </button>
                </nav>
            </header>

            <main className="Login_Main">
                <section className="Login_Hero" aria-labelledby="login-hero-title">
                    <h1 id="login-hero-title">
                        Build your own
                        <br />
                        research
                        <br />
                        space
                    </h1>

                    <p>
                        Organize texts, images, and references in one place.
                        Search across your materials, make connections, and
                        develop ideas in a focused workspace.
                    </p>

                    <div className="Login_Hero_Actions">
                        <button
                            type="button"
                            className="Login_Primary_Action"
                            onClick={() => switchAuthMode("signup")}
                        >
                            Get Started
                        </button>
                        <a className="Login_Secondary_Action" href="#features">
                            Learn More
                        </a>
                    </div>

                    <ul className="Login_Trust_List" aria-label="NEXO principles">
                        <li>Source-grounded</li>
                        <li>Private by design</li>
                        <li>Built for visual research</li>
                    </ul>
                </section>

                <form
                    className="Login_Card"
                    onSubmit={handleAuthSubmit}
                    autoComplete="on"
                >
                    <div className="Login_Card_Heading">
                        <h2>{isSignupMode ? "Create account" : "Welcome"}</h2>
                        <p>
                            {isSignupMode
                                ? "Create your NEXO research workspace."
                                : "Sign in to continue to your workspace."}
                        </p>
                    </div>

                    <label className="Login_Visually_Hidden" htmlFor="login-email">
                        Email
                    </label>
                    <input
                        id="login-email"
                        name="email"
                        className="Login_Input"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        disabled={authenticationBusy}
                        required
                    />

                    <label className="Login_Visually_Hidden" htmlFor="login-password">
                        Password
                    </label>
                    <input
                        id="login-password"
                        name="password"
                        className="Login_Input"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete={isSignupMode ? "new-password" : "current-password"}
                        minLength={isSignupMode ? 8 : 1}
                        disabled={authenticationBusy}
                        required
                    />

                    {isSignupMode && (
                        <>
                            <label
                                className="Login_Visually_Hidden"
                                htmlFor="login-confirm-password"
                            >
                                Confirm password
                            </label>
                            <input
                                id="login-confirm-password"
                                name="confirm-password"
                                className="Login_Input"
                                type="password"
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(event.target.value)
                                }
                                autoComplete="new-password"
                                minLength={8}
                                disabled={authenticationBusy}
                                required
                            />
                        </>
                    )}

                    <div className="Login_Options_Row">
                        <label className="Login_Remember_Option">
                            <input
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(event) =>
                                    setRememberMe(event.target.checked)
                                }
                                disabled={authenticationBusy}
                            />
                            <span>Remember me</span>
                        </label>

                        {!isSignupMode && (
                            <button
                                type="button"
                                className="Login_Forgot_Button"
                                onClick={handleForgotPassword}
                                disabled={authenticationBusy}
                            >
                                Forgot password?
                            </button>
                        )}
                    </div>

                    {errorMessage && (
                        <p className="Login_Error_Message" role="alert" aria-live="polite">
                            {errorMessage}
                        </p>
                    )}

                    <button
                        className="Login_Continue_Button"
                        type="submit"
                        disabled={authenticationBusy}
                    >
                        {isLoading
                            ? isSignupMode
                                ? "Creating account..."
                                : "Signing in..."
                            : isSignupMode
                              ? "Create account"
                              : "Sign In"}
                    </button>

                    <div className="Login_Divider" aria-hidden="true">
                        <span />
                        <p>Or</p>
                        <span />
                    </div>

                    {googleClientId ? (
                        <div
                            className={`Login_Google_Button_Host${isGoogleLoading ? " is-loading" : ""}`}
                            ref={googleButtonRef}
                            aria-label="Continue with Google"
                        />
                    ) : (
                        <button
                            className="Login_Google_Fallback"
                            type="button"
                            disabled
                            title="Set VITE_GOOGLE_CLIENT_ID to enable Google sign-in."
                        >
                            <span aria-hidden="true">G</span>
                            Continue with Google
                        </button>
                    )}

                    <p className="Login_Signup_Text">
                        {isSignupMode
                            ? "Already have an account? "
                            : "Don't have an account? "}
                        <button
                            type="button"
                            onClick={() =>
                                switchAuthMode(isSignupMode ? "login" : "signup")
                            }
                            disabled={authenticationBusy}
                        >
                            {isSignupMode ? "Sign in" : "Sign up"}
                        </button>
                    </p>
                </form>
            </main>

            <footer className="Login_Footer" id="about">
                <div className="Login_Footer_Brand">
                    <strong>NEXO</strong>
                    <p>A focused workspace for visual, source-grounded research.</p>
                </div>
                <div className="Login_Footer_Links" id="features">
                    <div>
                        <strong>Product</strong>
                        <span>Collections</span>
                        <span>Research canvas</span>
                    </div>
                    <div>
                        <strong>Company</strong>
                        <span>About</span>
                        <span>Contact</span>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default LoginPage;
