var experimentApp = angular.module('experimentApp', ['ngSanitize', 'ngCsv']);

function shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array
}

experimentApp.controller('ExperimentController',
  function ExperimentController($scope) {
    $scope.section = "instructions";
    $scope.inst_id = 0;
    $scope.stim_id = 0;
    $scope.part_id = -1;
    $scope.response = {"relprob": [50, 50, 50, 50 , 50]};
    $scope.csv_header = [
      "timestep",
      "goal_probs_0",
      "goal_probs_1",
      "goal_probs_2",
      "goal_probs_3",
      "goal_probs_4"
    ];
    $scope.csv_name = function() {
      return $scope.stimuli[$scope.stim_id-1].name + ".csv"
    }
    $scope.ratings = [];
    $scope.advance = function() {
      if ($scope.section == "instructions") {
        $scope.advance_instructions()
      } else if ($scope.section == "stimuli") {
        $scope.advance_stimuli()
      } else if ($scope.section == "endscreen") {
        // Do nothing
      }
    };
    $scope.advance_instructions = function() {
      if ($scope.inst_id == $scope.instructions.length - 1) {
        $scope.section = "stimuli";
        $scope.stim_id = 0;
        $scope.part_id = 0;
      } else {
        $scope.inst_id = $scope.inst_id + 1;
      }
      $scope.response = {"relprob": [50, 50, 50, 50 , 50]};
    };
    $scope.advance_stimuli = function() {
      if ($scope.stim_id == $scope.stimuli.length) {
        // Advance section
        $scope.section = "endscreen"
      } else if ($scope.part_id < 0) {
        // Advance to next stimulus
        $scope.part_id = $scope.part_id + 1;
        $scope.ratings = [];
        // set possible goals based on stimuli json
        $scope.possible_goals = $scope.stimuli[$scope.stim_id].goal_space;
      } else if ($scope.part_id < $scope.stimuli[$scope.stim_id].length) {
        // Advance to next part
        $scope.ratings.push($scope.compute_ratings($scope.response));
        $scope.part_id = $scope.part_id + 1;
        if ($scope.part_id == $scope.stimuli[$scope.stim_id].length) {
          // Advance to stimulus endscreen.
          $scope.part_id = -1;
          $scope.stim_id = $scope.stim_id + 1;
        }
      }
      $scope.response = {"relprob": [50, 50, 50, 50 , 50]};
    };
    $scope.compute_ratings = function(resp) {
      // Compute normalized probabilities from ratings
      probs = resp.relprob;
      sum_ratings = resp.relprob.reduce((a,b) => a + b, 0);
      probs = probs.map(p => p/sum_ratings);
      rating = {
        "timestep": $scope.stimuli[$scope.stim_id].times[$scope.part_id],
        "goal_probs_0": probs[0],
        "goal_probs_1": probs[1],
        "goal_probs_2": probs[2],
        "goal_probs_3": probs[3],
        "goal_probs_4": probs[4]
      }
      console.log(rating)
      return rating;
    };
    $scope.rating_labels = ["Very Unlikely", "Maybe", "Very Likely"];
    $scope.possible_goals = ["power", "cower", "crow", "core", "pore"];
    $scope.instruction_has_image = function() {
      return $scope.instructions[$scope.inst_id].image != null
    };
    $scope.is_tutorial = function() {
      return $scope.instructions[$scope.inst_id].tutorial == true
    };
    $scope.instructions = [
      {
        text: `Welcome to our goal inference experiment! <br>
               Press next to continue.`,
      },
      {
        text: `Imagine you're watching your friend play the video game above.
               Can you figure out which of the five words your friend is trying to spell?`,
        image: "tutorial/experiment-1a1.gif"
      },
      {
        text: ``,
        image: "tutorial/experiment-1a1.gif",
        tutorial: true
      },
      {
        text: `Yes, it was "POWER"!`,
        image: "tutorial/experiment-1a1.gif",
      },
      {
        text: `Once done, please remember to press the save button
               before advancing to the next task. (The button is currently
               disabled because this is just the tutorial). <br>
               <br>
               That's it for our tutorial.`,
        save: true
      },
      {
        text: `Ready to start? You have n tasks in total.
               Press next to continue!`
      }
    ];
    $scope.stimuli = shuffle([
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7],
        "name": "problem_1_1",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 0,
        "problem": 1,
        "length": 7,
        "images": [
          "stimuli/1/1/0.png",
          "stimuli/1/1/0.gif",
          "stimuli/1/1/1.gif",
          "stimuli/1/1/2.gif",
          "stimuli/1/1/3.gif",
          "stimuli/1/1/4.gif",
          "stimuli/1/1/5.gif"  
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7],
        "name": "problem_1_2",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 1,
        "problem": 1,
        "length": 7,
        "images": [
          "stimuli/1/2/0.png",
          "stimuli/1/2/0.gif",
          "stimuli/1/2/1.gif",
          "stimuli/1/2/2.gif",
          "stimuli/1/2/3.gif",
          "stimuli/1/2/4.gif",
          "stimuli/1/2/5.gif"  
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7],
        "name": "problem_1_3",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 3,
        "problem": 1,
        "length": 7,
        "images": [
          "stimuli/1/3/0.png",
          "stimuli/1/3/0.gif",
          "stimuli/1/3/1.gif",
          "stimuli/1/3/2.gif",
          "stimuli/1/3/3.gif",
          "stimuli/1/3/4.gif",
          "stimuli/1/3/5.gif"  
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6],
        "name": "problem_1_4",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 2,
        "problem": 1,
        "length": 6,
        "images": [
          "stimuli/1/4/0.png",
          "stimuli/1/4/0.gif",
          "stimuli/1/4/1.gif",
          "stimuli/1/4/2.gif",
          "stimuli/1/4/3.gif",
          "stimuli/1/4/4.gif" 
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9,10,11,12],
        "name": "problem_2_1",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 1,
        "problem": 2,
        "length": 12,
        "images": [
          "stimuli/2/1/0.png",
          "stimuli/2/1/0.gif",
          "stimuli/2/1/1.gif",
          "stimuli/2/1/2.gif",
          "stimuli/2/1/3.gif",
          "stimuli/2/1/4.gif", 
          "stimuli/2/1/5.gif",
          "stimuli/2/1/6.gif",
          "stimuli/2/1/7.gif",
          "stimuli/2/1/8.gif",
          "stimuli/2/1/9.gif", 
          "stimuli/2/1/10.gif",
          "stimuli/2/1/11.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9],
        "name": "problem_2_2",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 4,
        "problem": 2,
        "length": 9,
        "images": [
          "stimuli/2/2/0.png",
          "stimuli/2/2/0.gif",
          "stimuli/2/2/1.gif",
          "stimuli/2/2/2.gif",
          "stimuli/2/2/3.gif",
          "stimuli/2/2/4.gif", 
          "stimuli/2/2/5.gif",
          "stimuli/2/2/6.gif",
          "stimuli/2/2/7.gif",
          "stimuli/2/2/8.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9],
        "name": "problem_2_3",
        "optimal": true,
        "goal_space": ["ear", "reap", "pear", "wade", "draw"],
        "goal": 1,
        "problem": 2,
        "length": 9,
        "images": [
          "stimuli/2/3/0.png",
          "stimuli/2/3/0.gif",
          "stimuli/2/3/1.gif",
          "stimuli/2/3/2.gif",
          "stimuli/2/3/3.gif",
          "stimuli/2/3/4.gif", 
          "stimuli/2/3/5.gif",
          "stimuli/2/3/6.gif",
          "stimuli/2/3/7.gif",
          "stimuli/2/3/8.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7],
        "name": "problem_2_4",
        "optimal": true,
        "goal_space": ["wad", "reap", "war", "wade", "draw"],
        "goal": 4,
        "problem": 2,
        "length": 7,
        "images": [
          "stimuli/2/2/0.png",
          "stimuli/2/2/0.gif",
          "stimuli/2/2/1.gif",
          "stimuli/2/2/2.gif",
          "stimuli/2/2/3.gif",
          "stimuli/2/2/4.gif", 
          "stimuli/2/2/5.gif",
          "stimuli/2/2/6.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5],
        "name": "problem_3_1",
        "optimal": true,
        "goal_space": ["cower", "war", "wear", "crow", "core"],
        "goal": 1,
        "problem": 3,
        "length": 5,
        "images": [
          "stimuli/3/1/0.png",
          "stimuli/3/1/0.gif",
          "stimuli/3/1/1.gif",
          "stimuli/3/1/2.gif",
          "stimuli/3/1/3.gif",
          "stimuli/3/1/4.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9],
        "name": "problem_3_2",
        "optimal": true,
        "goal_space": ["cower", "war", "wear", "crow", "core"],
        "goal": 0,
        "problem": 3,
        "length": 9,
        "images": [
          "stimuli/3/2/0.png",
          "stimuli/3/2/0.gif",
          "stimuli/3/2/1.gif",
          "stimuli/3/2/2.gif",
          "stimuli/3/2/3.gif",
          "stimuli/3/2/4.gif",
          "stimuli/3/2/5.gif",
          "stimuli/3/2/6.gif",
          "stimuli/3/2/7.gif",
          "stimuli/3/2/8.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8],
        "name": "problem_3_3",
        "optimal": true,
        "goal_space": ["cower", "war", "wear", "crow", "core"],
        "goal": 4,
        "problem": 3,
        "length": 8,
        "images": [
          "stimuli/3/3/0.png",
          "stimuli/3/3/0.gif",
          "stimuli/3/3/1.gif",
          "stimuli/3/3/2.gif",
          "stimuli/3/3/3.gif",
          "stimuli/3/3/4.gif",
          "stimuli/3/3/5.gif",
          "stimuli/3/3/6.gif",
          "stimuli/3/3/7.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4,5,6,7,8,9],
        "name": "problem_3_4",
        "optimal": true,
        "goal_space": ["cower", "war", "wear", "crow", "core"],
        "goal": 3,
        "problem": 3,
        "length": 9,
        "images": [
          "stimuli/3/4/0.png",
          "stimuli/3/4/0.gif",
          "stimuli/3/4/1.gif",
          "stimuli/3/4/2.gif",
          "stimuli/3/4/3.gif",
          "stimuli/3/4/4.gif",
          "stimuli/3/4/5.gif",
          "stimuli/3/4/6.gif",
          "stimuli/3/4/7.gif",
          "stimuli/3/4/8.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4],
        "name": "problem_4_1",
        "optimal": true,
        "goal_space": ["power", "cower", "crow", "core", "pore"],
        "goal": 3,
        "problem": 4,
        "length": 4,
        "images": [
          "stimuli/4/1/0.png",
          "stimuli/4/1/0.gif",
          "stimuli/4/1/1.gif",
          "stimuli/4/1/2.gif",
          "stimuli/4/1/3.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3],
        "name": "problem_4_2",
        "optimal": true,
        "goal_space": ["raw", "paw", "draw", "war", "wear"],
        "goal": 2,
        "problem": 4,
        "length": 3,
        "images": [
          "stimuli/4/2/0.png",
          "stimuli/4/2/0.gif",
          "stimuli/4/2/1.gif",
          "stimuli/4/2/2.gif",
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3],
        "name": "problem_4_3",
        "optimal": true,
        "goal_space": ["ear", "paw", "dear", "war", "wear"],
        "goal": 4,
        "problem": 4,
        "length": 3,
        "images": [
          "stimuli/4/3/0.png",
          "stimuli/4/3/0.gif",
          "stimuli/4/3/1.gif",
          "stimuli/4/3/2.gif"
        ]
      },
      {
        "trial": 0,
        "times": [1,2,3,4],
        "name": "problem_4_4",
        "optimal": true,
        "goal_space": ["raw", "paw", "draw", "war", "wear"],
        "goal": 4,
        "problem": 4,
        "length": 4,
        "images": [
          "stimuli/4/4/0.png",
          "stimuli/4/4/0.gif",
          "stimuli/4/4/1.gif",
          "stimuli/4/4/2.gif"
        ]
      },
    ]);
  }
)
