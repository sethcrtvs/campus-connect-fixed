<?php
// api/utils/mailer.php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Adjusting paths based on your VS Code screenshot
require_once __DIR__ . '/../libs/PHPMailer/Exception.php';
require_once __DIR__ . '/../libs/PHPMailer/PHPMailer.php';
require_once __DIR__ . '/../libs/PHPMailer/SMTP.php';

class Mailer {
    public static function sendOTP($email, $name, $otp) {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host       = 'smtp.gmail.com'; 
            $mail->SMTPAuth   = true;
            $mail->Username   = 'lscribegaming228@gmail.com'; 
            $mail->Password   = 'bzzg kwiw mohe dbic'; 
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = 587;

            $mail->setFrom('noreply@campusconnect.ac.ke', 'Campus Connect');
            $mail->addAddress($email, $name);

            $mail->isHTML(true);
            $mail->Subject = 'Verify Your Campus Connect Account';
            $mail->Body    = "
                <div style='font-family: Arial; border: 1px solid #eee; padding: 30px; border-radius: 20px; text-align: center;'>
                    <h2 style='color: #EA580C;'>CAMPUS CONNECT</h2>
                    <p>Hi $name, use the code below to verify your student email:</p>
                    <div style='background: #FFF7ED; padding: 20px; margin: 20px 0; font-size: 32px; font-weight: 900; color: #EA580C; border: 2px dashed #EA580C; border-radius: 10px; letter-spacing: 5px;'>
                        $otp
                    </div>
                    <p style='font-size: 11px; color: #999;'>This code expires in 15 minutes.</p>
                </div>";

            return $mail->send();
        } catch (Exception $e) {
            error_log("PHPMailer Error: " . $mail->ErrorInfo);
            return false;
        }
    }
}