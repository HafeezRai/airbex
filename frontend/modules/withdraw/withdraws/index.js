var moment = require('moment')
, template = require('./index.html')

module.exports = function() {
    var itemTemplate = require('./item.html')
    , $el = $('<div class=withdraw-withdraws>').html(template())
    , controller = {
        $el: $el
    }
    , $items = $el.find('.items')

    function itemsChanged(items) {
        $items.html($.map(items, function(item) {
            item.ago = moment(item.created).fromNow()
            item.good = null
            item.bad = null

            if (item.method == 'ripple') {
                item.destination = 'Ripple: ' + item.destination
            }

            if (item.state == 'completed') {
                item.status = i18n('withdraws.states.completed',
                    moment(item.completed).fromNow())
                item.good = true
            } else if (item.state == 'processing') {
                item.status = i18n('withdraws.states.processing')
            } else if (item.state == 'requested') {
                item.status = i18n('withdraws.states.requested')
            } else if (item.state == 'sendingEmail') {
                item.status = i18n('withdraws.states.sendingEmail')
            } else if (item.state == 'cancelled') {
                if (item.error) {
                    item.status = i18n('withdraws.states.cancelled.error', item.error)
                    item.bad = true
                } else if (item.error === null) {
                    item.status = i18n('withdraws.states.cancelled')
                }
            } else {
                item.status = 'Unknown, ' + item.state
            }

            var $el = $(itemTemplate(item))
            $el.attr('data-id', item.id)
            return $el
        }))

        $el.toggleClass('is-empty', !items.length)
        .addClass('has-loaded')
    }

    function refresh() {
        $el.addClass('is-loading')

        api.call('v1/withdraws')
        .then(itemsChanged)
        .fail(errors.alertFromXhr)
        .finally(function() {
            $el.removeClass('is-loading')
        })
        
    }

    $items.on('click', '.cancel', function(e) {
        e.preventDefault()
        var $item = $(e.target).closest('.item')

        api.call('v1/withdraws/' + $item.attr('data-id'), null, { type: 'DELETE' })
        .then(function() {
            api.fetchBalances()
            refresh()
        })
        .fail(errors.alertFromXhr)
    })

    refresh()

    return controller
}
