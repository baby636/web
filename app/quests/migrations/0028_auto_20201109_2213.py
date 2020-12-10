# Generated by Django 2.2.4 on 2020-11-09 22:13

from django.db import migrations


def forwards(apps, schema_editor):
    from quests.models import Quest
    for quest in Quest.objects.filter(visible=True):
        if quest.kudos_reward.on_xdai:
            quest.kudos_reward = quest.kudos_reward.on_xdai
            quest.save()
            print(f'migrated {quest.pk}');
        elif quest:
            print(f'could not migrate {quest.pk}');
            quest.visible=False
            quest.save()


def backwards(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('quests', '0027_auto_20200520_1454'),
    ]

    operations = [
         migrations.RunPython(forwards, backwards),
    ]
