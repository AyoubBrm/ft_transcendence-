import pyotp
import base64
import qrcode
import io


class TwoFactorAuth:
    @staticmethod
    def generate_2fa_secret():
        return pyotp.random_base32()
    
    @staticmethod
    def generate_qr_code(username, secret):
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(username, issuer_name="YourApp")
        
        # Generate QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        return base64.b64encode(buffer.getvalue()).decode()

    @staticmethod
    def verify_2fa_code(secret, code):
        totp = pyotp.TOTP(secret)
        return totp.verify(code)