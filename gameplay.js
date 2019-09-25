const stats = require('./stats');

class Gameplay {
  constructor() {
    this.id = 0; // Game ID
    this.level = 0; // Choosed level
    this.is_play = 0; // play or now
    this.time = 0; // time of play
    this.result = {
      id: 0, // Game Id
      level: 0, // Choosed level
      time: 10, // Time of play
      status: 0, // win (1) or loose (0)
    };
    this.clicked = 0; // how much clicked now
    this.maxClicked = 0; // how need to click for win
    this.timeout = undefined;
  }

  reset() {
    this.level = 0;
    this.is_play = 0;
    this.update();
  }

  setLevel(n) {
    this.level = n;
    this.maxClicked = n * 20;
    this.clicked = 0;
    this.time = 10;
    this.update();
  }

  play() {
    this.id += 1;
    this.is_play = 1;
    this.timeout = setInterval(() => {
      this.time -= 1;
      this.update();
      if (this.time === 0) {
        clearInterval(this.timeout);
        this.fail();
      }
    }, 1000);
    this.update();
  }

  win() {
    clearTimeout(this.timeout);
    this.is_play = 2;
    this.result = {
      id: this.id,
      level: this.level,
      time: this.time,
      score: this.score(),
      status: 1,
    };
    this.save();
    this.update();
  }

  click() {
    this.clicked += 1;
    if (this.maxClicked === this.clicked) this.win();
    this.update();
  }

  fail() {
    this.is_play = 3;
    this.result = {
      id: this.id,
      level: this.level,
      time: this.time,
      score: this.score(),
      status: 0,
    };
    this.save();
    this.update();
  }

  score() {
    return this.level * this.time + this.clicked;
  }

  save() {
    stats.add(this.result);
  }

  update() {
    const data = {
      id: 0,
      level: this.level,
      time: this.time,
      is_play: this.is_play,
      result: this.result,
      clicked: this.clicked,
      max_clicked: this.maxClicked,
    };
    global.io.emit('state', data);
  }
}

module.exports = Gameplay;
