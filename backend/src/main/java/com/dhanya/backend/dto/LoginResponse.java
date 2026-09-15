package com.dhanya.backend.dto;

public class LoginResponse {
    private boolean success;
    private String message;
    private String token;
    private String role;
    private String millCode;
    private String millName;
    private String displayName;

    public LoginResponse() {}

    public LoginResponse(boolean success, String message, String token, String role, String millCode, String millName, String displayName) {
        this.success = success;
        this.message = message;
        this.token = token;
        this.role = role;
        this.millCode = millCode;
        this.millName = millName;
        this.displayName = displayName;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getMillCode() { return millCode; }
    public void setMillCode(String millCode) { this.millCode = millCode; }
    public String getMillName() { return millName; }
    public void setMillName(String millName) { this.millName = millName; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
}
