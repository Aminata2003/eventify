import django_filters
from django.db.models import Q
from .models import Event


class EventFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    category = django_filters.CharFilter(
        field_name="category",
        lookup_expr="iexact"
    )
    location = django_filters.CharFilter(
        field_name="location",
        lookup_expr="icontains"
    )

    class Meta:
        model = Event
        fields = [
            "category",
            "location",
        ]

    def filter_search(self, queryset, name, value):
        return queryset.filter(
            Q(title__icontains=value)
            | Q(description__icontains=value)
            | Q(category__icontains=value)
            | Q(location__icontains=value)
            | Q(venue__icontains=value)
        )