from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('events', '0002_payment'),
    ]

    operations = [
        migrations.AddField(
            model_name='registration',
            name='reminder_sent',
            field=models.BooleanField(default=False),
        ),
    ]
