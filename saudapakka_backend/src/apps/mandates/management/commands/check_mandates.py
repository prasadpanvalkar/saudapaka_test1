from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.mandates.models import Mandate

class Command(BaseCommand):
    help = 'Expires mandates based on 7-day acceptance and 90-day validity rules'

    def handle(self, *args, **options):
        now = timezone.now()
        today = now.date()

        # 1. Handle 7-Day Acceptance Expiry
        unaccepted = Mandate.objects.filter(
            status='PENDING',
            acceptance_expires_at__lte=now
        ).update(status='EXPIRED')

        # 2. Handle 90-Day Validity Expiry
        expired_active = Mandate.objects.filter(
            status='ACTIVE',
            end_date__lte=today
        ).update(status='EXPIRED')

        self.stdout.write(self.style.SUCCESS(
            f'Successfully processed: {unaccepted} pending and {expired_active} active mandates expired.'
        ))