package com.taskosaur.taskosaur.services;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.smtp-from:}")
    private String smtpFrom;

    @Value("${spring.mail.host:}")
    private String mailHost;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Async
    public void sendInvitationEmail(
            String toEmail,
            String inviterName,
            String entityName,
            String entityType,
            String role,
            String invitationUrl,
            LocalDateTime expiresAt
    ) {
        String formattedDate = expiresAt != null
                ? expiresAt.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))
                : "7 days";

        log.info("""
                
                ================================================================================
                📧 [INVITATION EMAIL]
                To: {}
                Inviter: {}
                Entity: {} "{}" (Role: {})
                Invitation Link: {}
                Expires At: {}
                ================================================================================
                """, toEmail, inviterName, entityType, entityName, role, invitationUrl, formattedDate);

        String effectiveHost = (mailHost != null && !mailHost.isBlank())
                ? mailHost
                : System.getProperty("SMTP_HOST", "smtp.gmail.com");

        String effectiveUser = (mailUsername != null && !mailUsername.isBlank())
                ? mailUsername
                : System.getProperty("SMTP_USER", "");

        String effectivePass = System.getProperty("SMTP_PASS", "");

        String fromAddress = (smtpFrom != null && !smtpFrom.isBlank() && !smtpFrom.contains("example.com"))
                ? smtpFrom
                : effectiveUser;

        boolean isRealSmtpConfigured = effectiveHost != null
                && !effectiveHost.contains("example.com")
                && !effectiveUser.isBlank();

        if (!isRealSmtpConfigured) {
            log.warn("SMTP credentials not detected (host: {}, user: {}). Real email skipped.", effectiveHost, effectiveUser);
            return;
        }

        try {
            if (mailSender instanceof JavaMailSenderImpl impl) {
                if (impl.getUsername() == null || impl.getUsername().isBlank()) {
                    impl.setUsername(effectiveUser);
                }
                if ((impl.getPassword() == null || impl.getPassword().isBlank()) && !effectivePass.isBlank()) {
                    impl.setPassword(effectivePass);
                }
                if (impl.getHost() == null || impl.getHost().isBlank() || impl.getHost().contains("example.com")) {
                    impl.setHost(effectiveHost);
                }
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String senderEmail = fromAddress.isBlank() ? effectiveUser : fromAddress;
            helper.setFrom(new InternetAddress(senderEmail, "Taskosaur", "UTF-8"));
            helper.setReplyTo(senderEmail);
            helper.setTo(toEmail);
            helper.setSubject("You're invited to join " + entityName + " on Taskosaur");

            String plainText = """
                    Hello,
                    
                    %s has invited you to join the %s "%s" as a %s.
                    
                    Click the link below to accept the invitation:
                    %s
                    
                    This invitation will expire on %s.
                    
                    Best regards,
                    Taskosaur Team
                    """.formatted(inviterName, entityType, entityName, role, invitationUrl, formattedDate);

            String html = buildInvitationHtml(inviterName, entityName, entityType, role, invitationUrl, formattedDate);
            helper.setText(plainText, html);

            mailSender.send(message);
            log.info("Invitation email successfully delivered to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send invitation email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    @Async
    public void sendPasswordResetEmail(String toEmail, String userName, String resetToken, String resetUrl) {
        log.info("""
                
                ================================================================================
                🔑 [PASSWORD RESET EMAIL]
                To: {}
                User: {}
                Reset Token: {}
                Reset Link: {}
                ================================================================================
                """, toEmail, userName, resetToken, resetUrl);

        String effectiveHost = (mailHost != null && !mailHost.isBlank())
                ? mailHost
                : System.getProperty("SMTP_HOST", "smtp.gmail.com");

        String effectiveUser = (mailUsername != null && !mailUsername.isBlank())
                ? mailUsername
                : System.getProperty("SMTP_USER", "");

        String effectivePass = System.getProperty("SMTP_PASS", "");

        String fromAddress = (smtpFrom != null && !smtpFrom.isBlank() && !smtpFrom.contains("example.com"))
                ? smtpFrom
                : effectiveUser;

        boolean isRealSmtpConfigured = effectiveHost != null
                && !effectiveHost.contains("example.com")
                && !effectiveUser.isBlank();

        if (!isRealSmtpConfigured) {
            log.warn("SMTP credentials not detected (host: {}, user: {}). Real password reset email skipped.", effectiveHost, effectiveUser);
            return;
        }

        try {
            if (mailSender instanceof JavaMailSenderImpl impl) {
                if (impl.getUsername() == null || impl.getUsername().isBlank()) {
                    impl.setUsername(effectiveUser);
                }
                if ((impl.getPassword() == null || impl.getPassword().isBlank()) && !effectivePass.isBlank()) {
                    impl.setPassword(effectivePass);
                }
                if (impl.getHost() == null || impl.getHost().isBlank() || impl.getHost().contains("example.com")) {
                    impl.setHost(effectiveHost);
                }
            }

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            String senderEmail = fromAddress.isBlank() ? effectiveUser : fromAddress;
            helper.setFrom(new InternetAddress(senderEmail, "Taskosaur", "UTF-8"));
            helper.setReplyTo(senderEmail);
            helper.setTo(toEmail);
            helper.setSubject("Reset your Taskosaur password");

            String plainText = """
                    Hello %s,
                    
                    We received a request to reset your password. Click the link below to set a new password:
                    %s
                    
                    This link will expire in 24 hours.
                    
                    If you did not request a password reset, please ignore this email.
                    
                    Best regards,
                    Taskosaur Team
                    """.formatted(userName != null ? userName : "there", resetUrl);

            String html = buildPasswordResetHtml(userName != null ? userName : "there", resetUrl);
            helper.setText(plainText, html);

            mailSender.send(message);
            log.info("Password reset email successfully delivered to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage(), e);
        }
    }

    private String buildPasswordResetHtml(String userName, String resetUrl) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Reset your password</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 40px 20px;">
                  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #2563eb; padding: 24px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Taskosaur</h1>
                    </div>
                    <div style="padding: 32px 24px;">
                      <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">Password Reset Request</h2>
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                        Hello <strong>%s</strong>,<br>
                        We received a request to reset your password. Click the button below to choose a new password.
                      </p>
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="%s" style="background-color: #2563eb; color: #ffffff; padding: 12px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">
                          Reset Password
                        </a>
                      </div>
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.4;">
                        Or copy and paste this link into your browser:<br>
                        <a href="%s" style="color: #2563eb; word-break: break-all;">%s</a>
                      </p>
                      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        This password reset link will expire in 24 hours. If you did not make this request, you can safely ignore this email.
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(userName, resetUrl, resetUrl, resetUrl);
    }

    private String buildInvitationHtml(
            String inviterName,
            String entityName,
            String entityType,
            String role,
            String invitationUrl,
            String formattedDate
    ) {
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Invitation to Taskosaur</title>
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f5f7; margin: 0; padding: 40px 20px;">
                  <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
                    <div style="background-color: #2563eb; padding: 24px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Taskosaur</h1>
                    </div>
                    <div style="padding: 32px 24px;">
                      <h2 style="color: #1f2937; margin-top: 0; font-size: 20px;">You've been invited!</h2>
                      <p style="color: #4b5563; font-size: 16px; line-height: 1.5;">
                        <strong>%s</strong> has invited you to join the %s <strong>"%s"</strong> as a <strong>%s</strong>.
                      </p>
                      <div style="text-align: center; margin: 32px 0;">
                        <a href="%s" style="background-color: #2563eb; color: #ffffff; padding: 12px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">
                          Accept Invitation
                        </a>
                      </div>
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.4;">
                        Or copy and paste this link into your browser:<br>
                        <a href="%s" style="color: #2563eb; word-break: break-all;">%s</a>
                      </p>
                      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                        This invitation will expire on %s. If you did not expect this invitation, you can ignore this email.
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(inviterName, entityType, entityName, role, invitationUrl, invitationUrl, invitationUrl, formattedDate);
    }
}
