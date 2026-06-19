resource "aws_ses_email_identity" "alert" {
  email = var.alert_email
}
