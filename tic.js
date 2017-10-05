'use strict'

var readlineSync = require('readline-sync')

main()

function main () {
  var highscores = new Map()

  do {
    var boardsize = ask('Game board size (row x col)?', 'row x col / eg. 99 / atleast 33', '^[3-9][3-9]$')
    var towin = ask('How many in a row to win?', 'Must be 3-9', '^[3-9]$')
    var mode = ask('Computer or human mode (C/H)?', 'C/H', '^[CH]$')

    var board = initBoard(boardsize[0], boardsize[1])

    switch (mode) {
      case 'C':
        var s = new Date()
        var startTime = s.getTime()

        var winner = computerMode(board, parseInt(towin))
        if (winner !== 'Quit' && winner !== 'Tie') { console.log(winner + ' wins!!') }

        var e = new Date()
        var endTime = e.getTime()
        // highscore based on fastest time to win
        var score = Math.round((endTime - startTime) / 1000) + ' seconds'

        if ((winner === 'Player' && highscores.has(boardsize) && score < highscores.get(boardsize)) ||
                    (winner === 'Player' && !highscores.has(boardsize))) {
          console.log('New highscore!!! : ' + score)
          highscores.set(boardsize, score)
        }

        for (var [key, value] of highscores) {
          console.log('Boardsize:' + key + ' Highscore:' + value)
        }
        break

      case 'H':
        printBoard(board)
        humanMode(board, parseInt(towin))
        break
    }
  } while (ask('Quit? (Y/N)', 'Y/N', '^[YN]$') !== 'Y')
}

// human against computer
function computerMode (board, towin) {
  var move = ''
  var mover = ''
  var movec = ''
  var winrow = towin
  var res = 0
  var maxres = 0
  var r = 0
  var c = 0
  var firstmove = ask('Who has first move computer or human? (C/H): ?', 'C/H', '^[CH]$')
  printBoard(board)
  do {
    if (firstmove === 'H') {
      // input users move
      do {
        move = ask('Place X (rowcol) (00 to quit): ?', 'rxc / 99', '^[0-9][0-9]$')
        mover = move[0] - 1
        movec = move[1] - 1
        if (move === '00') return 'Quit'
      } while (board[mover][movec] === 'X' || board[mover][movec] === 'O')

      // check if human player wins
      board[mover][movec] = 'X'
      printBoard(board)
      res = checkResult(board, winrow, 'X')
      if (res > 100) {
        return 'Player'
      }
      if (res === -1) {
        return 'Tie'
      }
    }

    // try out many randowm moves for computer
    for (let trial = 0; trial < 1000; trial++) {
      do {
        var tr = Math.floor(Math.random() * board.length)
        var tc = Math.floor(Math.random() * (board[tr].length))
      } while (board[tr][tc] === 'X' || board[tr][tc] === 'O') // is the square empty?
      r = tr
      c = tc
      // computer has only 1 move look ahead....
      // if computer and opponent both have winning moves 
      // it is still based on luck which gets selected...

      // check if selected square has computers direct win
      board[tr][tc] = 'O'
      res = checkResult(board, winrow, 'O')
      if (res > 100) {
        r = tr // must use winning move
        c = tc
        board[tr][tc] = 'O'
        break
      } else {
        // check if selected square has opponents direct win
        board[tr][tc] = 'X'
        res = checkResult(board, winrow, 'X')
        if (res > 100) {
          r = tr // must block opponent
          c = tc
          board[tr][tc] = '_'
          break
        } else {
        // try the random move and evaluate the board
          (board[tr][tc] = 'O')
          res = checkResult(board, winrow, 'O')
          //  maxres is the value of the best move so far
          if (res > maxres) {
            maxres = res
            r = tr
            c = tc
          }
          board[tr][tc] = '_'
        }
      }
    }

    board[r][c] = 'O'
    console.log('Computer moves:' + (r + 1) + ' ' + (c + 1))
    firstmove = 'H'
    printBoard(board)
    // evaluate if Computer wins or a tie
    res = checkResult(board, winrow, 'O')
    if (res > 100) {
      return 'Computer'
    }
    if (res === -1) {
      console.log('It is a tie!')
      return 'Tie'
    }
  } while (move !== '00')
}

// human against human
function humanMode (board, towin) {
  var move = ''
  var mover = ''
  var movec = ''
  var winrow = towin
  var res = 0
  do {
    // input player X move
    do {
      move = ask('Place X (rowcol) (00 to quit): ?', 'rxc / 99', '^[0-9][0-9]$')
      if (move === '00') return
      mover = move[0] - 1
      movec = move[1] - 1
    } while (board[mover][movec] === 'X' || board[mover][movec] === 'O') // is the square empty?

    board[mover][movec] = 'X'
    printBoard(board)
    res = checkResult(board, winrow, 'X')
    if (res > 99) {
      console.log('You win!!!')
      return
    }
    if (res === -1) {
      console.log('It is a tie!')
      return 'Tie'
    }

    // input player O move
    do {
      move = ask('Place O (rowcol) (00 to quit): ?', 'rxc / 99', '^[0-9][0-9]$')
      if (move === '00') return
      mover = move[0] - 1
      movec = move[1] - 1
    } while (board[mover][movec] === 'X' || board[mover][movec] === 'O')
    if (move === '00') return

    // evaluate if the move is a winning move or a tie
    board[mover][movec] = 'O'
    printBoard(board)
    res = checkResult(board, winrow, 'O')
    if (res > 99) {
      console.log('You win!!!')
      return
    }
    if (res === -1) {
      console.log('It is a tie!')
      return 'Tie'
    }
  } while (move !== '00')
}

// evaluate the board: rows, columns and diagonals
function checkResult (board, winrow, char) {
  var boardvalue = 0
  var res = 0

  res = checkInrow(board, winrow, char)
  boardvalue = boardvalue + res

  res = checkIncol(board, winrow, char)
  boardvalue = boardvalue + res

  res = checkIndiag(board, winrow, char)
  boardvalue = boardvalue + res

  res = checkIndiagr(board, winrow, char)
  boardvalue = boardvalue + res

  res = checkTie(board)
  if (res === true && boardvalue < 100) {
    return -1
  }
  return boardvalue
}

// how many in a row?
function checkInrow (board, winrow, char) {
  var inrow = 0
  var maxinrow = 0
  for (let r = 0; r < board.length; r = r + 1) {
    for (let c = 0; c < board[r].length; c = c + 1) {
      if (board[r][c] === char) {
        inrow++
        if (inrow > maxinrow) {
          maxinrow = inrow
        }
      } else {
        inrow = 0
      }
    }
    inrow = 0
  }
  if (maxinrow === winrow) { maxinrow = 100 } // direct win
  return maxinrow
}

// how many in a column?
function checkIncol (board, winrow, char) {
  var incol = 0
  var maxincol = 0
  var r = 0
  for (let c = 0; c < board[r].length; c = c + 1) {
    for (let r = 0; r < board.length; r = r + 1) {
      if (board[r][c] === char) {
        incol++
        if (incol > maxincol) {
          maxincol = incol
        }
      } else {
        incol = 0
      }
    }
    incol = 0
  }
  if (maxincol === winrow) { maxincol = 100 } // direct win  
  return maxincol
}

// how many in a diagonal?
function checkIndiag (board, winrow, char) {
  var maxindiag = 0
  for (let r = 0; r < board.length - winrow + 1; r = r + 1) {
    for (let c = 0; c < board[r].length; c = c + 1) {
      var indiag = 0
      if (board[r][c] === char) {
        indiag++
        for (let count = 1; count < winrow; count++) {
          if (board[r + count][c + count] === char) {
            indiag++
            if (indiag > maxindiag) {
              maxindiag = indiag
            }
          }
        }
      } indiag = 0
    }
  }
  if (maxindiag === winrow) { maxindiag = 100 } // direct win  

  return maxindiag
}

// how many in a reverse diagonal?
function checkIndiagr (board, winrow, char) {
  var maxindiagr = 0
  var indiagr = 0
  for (let r = 0; r < board.length - winrow + 1; r = r + 1) {
    for (let c = winrow - 1; c < board[r].length; c = c + 1) {
      if (board[r][c] === char) {
        indiagr++
        for (let count = 1; count < winrow; count++) {
          if (board[r + count][c - count] === char) {
            indiagr++
            if (indiagr > maxindiagr) {
              maxindiagr = indiagr
            }
          }
        }
      } indiagr = 0
    }
  }
  if (maxindiagr === winrow) { maxindiagr = 100 } // direct win  
  return maxindiagr
}

// is it a tie??
function checkTie (board) {
  var maxmoves = board.length * board[1].length
  var moves = 0

  for (let r = 0; r < board.length; r = r + 1) {
    for (let c = 0; c < board[r].length; c = c + 1) {
      if (board[r][c] === 'X' || board[r][c] === 'O') { moves++ }
    }
  }
  if (moves === maxmoves) {
    return true
  } else { return false }
}

// empty board
function initBoard (row, col) {
  var board = new Array(row)
  for (var i = 0; i < row; i++) {
    board[i] = new Array(col)
  }

  for (let r = 0; r < row; r = r + 1) {
    for (let c = 0; c < col; c = c + 1) {
      board[r][c] = '_'
    }
  }
  return board
}

// output board
function printBoard (board) {
  for (let r = 0; r < board.length; r = r + 1) {
    var string = ''
    for (let c = 0; c < board[r].length; c = c + 1) {
      string = string + board[r][c] + ' '
    }
    console.log(string)
  }
}

// read user input
function ask (question, errormsg, reg) {
  var regex = new RegExp(reg)
  var value = ''
  var success = false
  do {
    value = readlineSync.question(question + ': ')
    success = regex.test(value)
    if (!success) {
      console.log(errormsg)
    }
  } while (!success)
  return value
}
