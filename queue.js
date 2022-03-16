/**
 * Created by stevenzhu on 2016/5/3/003, Guangzhou, China
 * MailTo:cnvoid@126.com
 */
module.exports = function () {
    'use strict';
    return {
        queue: [],
        doing: false,
        event: {},
        enqueue: function (data) {
            if (!data) {
                return false;
            }
            console.log('enqueue')
            this.queue.push(data)
            return this
        },

        dequeue: function () {
            
            return this.queue.shift()
        },

        startLoop: function () {
            if (!this.doing && this.queue.length > 0) {

                let item = this.dequeue()
                if (typeof item == 'function'){
                    item()
                    this.doing = true
                } 
            }
            return this
        },

        killFront: function () {
            this.doing = false
            this.startLoop()
            console.log('dequeue', this.queue.length)
            if(this.queue.length === 0) {
                typeof this.event['empty'] == 'function' && this.event['empty']()
            }
            return this
        },

        on: function(event, cb) {
            this.event[event] = cb
        }

    }
}