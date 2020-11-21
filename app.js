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
    $scope.response = {"goal": null, "relprob": [50, 50]};
    $scope.csv_header = [
      "timestep",
      "true_goal_probs",
      "goal_probs_0",
      "goal_probs_1",
      "goal_probs_2"
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
      $scope.response = {"goal": null, "relprob": [50, 50]};
    };
    $scope.advance_stimuli = function() {
      if ($scope.stim_id == $scope.stimuli.length) {
        // Advance section
        $scope.section = "endscreen"
      } else if ($scope.part_id < 0) {
        // Advance to next stimulus
        $scope.part_id = $scope.part_id + 1;
        $scope.ratings = [];
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
      $scope.response = {"goal": null, "relprob": [50, 50]};
    };
    $scope.compute_ratings = function(resp) {
      if (resp.goal == null) {resp.goal = 0;}
      if (resp.goal == -1) {
        // Handle equally likely option
        probs = [1.0, 1.0, 1.0];
        resp.goal = 0;
      } else {
        // Compute unnormalized probabilities from relative probabilities
        probs = [0.0, 0.0, 0.0];
        probs[resp.goal] = 1.0;
        probs[(resp.goal+1) % 3] = resp.relprob[0] / 100;
        probs[(resp.goal+2) % 3] = resp.relprob[1] / 100;
      }
      // Normalize probabilities
      sumprobs = probs.reduce((a,b) => a + b, 0);
      probs = probs.map(p => p/sumprobs);
      rating = {
        "timestep": $scope.stimuli[$scope.stim_id].times[$scope.part_id],
        "true_goal_probs": probs[resp.goal], // FIX ME - this should look up true goal for stimulus
        "goal_probs_0": probs[0],
        "goal_probs_1": probs[1],
        "goal_probs_2": probs[2]
      }
      console.log(rating)
      return rating;
    };
    $scope.rating_labels = ["Extremely Unlikely", "50/50", "Extremely Likely"];
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
        text: `Rate how likely each word is.`,
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
        "times": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13
        ],
        "name": "problem_1_a1",
        "optimal": true,
        "goal": 1,
        "problem": 1,
        "length": 13,
        "images": [
          "stimuli/1/a1/0.png",
          "stimuli/1/a1/1.png",
          "stimuli/1/a1/2.png",
          "stimuli/1/a1/3.png",
          "stimuli/1/a1/4.png",
          "stimuli/1/a1/5.png",
          "stimuli/1/a1/6.png",
          "stimuli/1/a1/7.png",
          "stimuli/1/a1/8.png",
          "stimuli/1/a1/9.png",
          "stimuli/1/a1/10.png",
          "stimuli/1/a1/11.png",
          "stimuli/1/a1/12.png"   
        ]
      },
      {
        "trial": 0,
        "times": [
          1,
          7,
          13,
          19,
          24,
          31,
          37,
          43,
          49,
          54,
          61,
          67,
          73
        ],
        "name": "problem_1_a2",
        "optimal": true,
        "goal": 1,
        "problem": 1,
        "length": 13,
        "images": [
          "stimuli/1/a2/0.png",
          "stimuli/1/a2/1.png",
          "stimuli/1/a2/2.png",
          "stimuli/1/a2/3.png",
          "stimuli/1/a2/4.png",
          "stimuli/1/a2/5.png",
          "stimuli/1/a2/6.png",
          "stimuli/1/a2/7.png",
          "stimuli/1/a2/8.png",
          "stimuli/1/a2/9.png",
          "stimuli/1/a2/10.png",
          "stimuli/1/a2/11.png",
          "stimuli/1/a2/12.png"   
        ]
      }
    ]);
  }
)
