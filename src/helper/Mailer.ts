import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Brevo from '@getbrevo/brevo';

@Injectable()
export class MailService {
  constructor(private configService: ConfigService) {}

  async sendMail(
    to: string,
    name: string,
    subject: string,
    template: string,
  ): Promise<boolean> {
    try {
      const apiKey = this.configService.get('BREVO_API_KEY');

      const apiInstance = new Brevo.TransactionalEmailsApi();
      apiInstance.setApiKey(0, apiKey);

      await apiInstance.sendTransacEmail({
        sender: {
          name: this.configService.get('BREVO_SENDER'),
          email: this.configService.get('BREVO_SENDER_MAIL'),
        },
        to: [
          {
            name: name,
            email: to,
          },
        ],
        subject: subject,
        htmlContent: template,
      });

      return true;
    } catch (error) {
      console.log('ERROR SENDING EMAIL: ', error);
      return false;
    }
  }
}
