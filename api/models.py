from django.db import models
from django.utils import timezone

class MasAPIToken(models.Model):
    token = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def is_expired(self):
        """
        Assume token expires in 1 hour unless MAS API specifies otherwise.
        """
        return (timezone.now() - self.created_at).total_seconds() > 3600