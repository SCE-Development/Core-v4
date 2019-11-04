const express = require('express')
const router = express.Router()
const Event = require('../models/Event')

// const settings = require('../../util/settings')

const { OK, NOT_FOUND, BAD_REQUEST } = {
  OK: 200,
  NOT_FOUND: 404,
  BAD_REQUEST: 400
}

// get information about all events
router.route('/').get(function (req, res) {
  Event.find(function (err, events) {
    if (err) {
      console.log('error getting events: ' + err)
    } else {
      res.json(events)
    }
  })
})

// create event -> pushing to db (admin)
router.post('/createEvent', (req, res) => {
  const newEvent = new Event({
    id: req.body.id,
    title: req.body.title,
    description: req.body.description,
    location: req.body.location,
    eventDate: req.body.eventDate,
    datePosted: Date.now,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    eventCategory: req.body.eventCategory
  })
  // save the event to db
  newEvent
    .save()
    .then(event => {
      res.status(OK).json({ event: 'event successfully added' })
    })
    .catch(err => {
      res.status(BAD_REQUEST).send('adding new event failed', err)
    })
})

// edit event -> pushing to db (admin)
router.post('/editEvent', (req, res) => {
  Event.findOne({ title: req.body.title })
    .then(event => {
      // do i have to worry about if they don't change? (check for null?)
      event.id = req.body.id
      event.title = req.body.title
      event.description = req.body.description
      event.location = req.body.location
      event.eventDate = req.body.eventDate
      event.startTime = req.body.endTime
      event.eventCategory = req.body.eventCategory
      // save updates
      event
        .save()
        .then(ret => {
          res.status(OK).json({ ret, event: 'event updated successfully' })
        })
        .catch(err => {
          res.status(BAD_REQUEST).send(err, 'event was not updated')
        })
    })
    .catch(err => {
      res.status(NOT_FOUND).send(err, 'event not found')
    })
})

// delete event -> pushing to db (admin)
router.post('/deleteEvent', (req, res) => {
  Event.deleteOne({ title: req.body.title })
    .then(event => {
      res.status(OK).json({ event: 'event successfully deleted' })
    })
    .catch(err => {
      res.status(BAD_REQUEST).send(err, 'deleting event failed')
    })
})

module.exports = router
