from django.conf.urls import patterns, include, url

import views

urlpatterns = patterns('',
    url(r'^upload_capp$', views.addCoursesTaken, name='addCoursesTaken'),
)
