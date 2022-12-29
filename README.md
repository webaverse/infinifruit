## InfiniFruit

Ever wanted to create a plant within your world that never ends? The Infinifruit is just for you! A fun and intresting item to edit or add to your scene.

![](https://i.imgur.com/LfI0d3h.png)


This exmaple shows you:

- How to add the InfiniFruit to your scene.
- How to replace the fruits used as well as the base plant used.
- What files relate to InfiniFruit.


## How To Get Started

You can see the InfiniFruit in use on the [Treehouse](https://local.webaverse.com:3000/?src=.%2Fscenes%2Ftreehouse.scn) scene.

**Fork InfiniFruit on Github**

You can find the repo [here](https://github.com/webaverse/infinifruit).

Adding the original Infinifruit to your scene:

```    },
    {
      "position": [
        4,
        0,
        3
      ],
      "quaternion": [
        0,
        0,
        0,
        1
      ],
      "physics": false,
      "start_url": "https://webaverse.github.io/infinifruit/",
      "dynamic": true
    },
```

**How To Replace The Fruit**

Once forked, you can see how the files for this item is laid out. We have a folder for fruit, as well as a .metaversefile and index.js.

![](https://i.imgur.com/qWeSbXn.png)

First step is uploading your own fruit GLB file to the fruit folder.
![](https://i.imgur.com/6W9bvCX.png)

![](https://i.imgur.com/lmWDLt4.png)

While uploading your own GLB file for your fruit, you can also edit the .metaversefile to change the name of the item in game when picked up.
```
{
  "name": "fruit",
  "start_url": "fruit.js",
  "components": [
    {
      "key": "wear",
      "value": {
        "boneAttachment": "leftHand",
        "position": [-0.05, -0.1, -0.05],
        "quaternion": [0.7071067811865475, 0, 0, 0.7071067811865476],
        "scale": [1, 1, 1]
      }
    },
    {
      "key": "use",
      "value": {
        "animation": "eat",
        "behavior": "eat",
        "boneAttachment": "leftHand",
        "position": [-0.05, -0.1, -0.05],
        "quaternion": [0.7071067811865475, 0, 0, 0.7071067811865476],
        "scale": [1, 1, 1]
      }
    }
  ]
}
```

After replacing the name and uploading your GLB files, head back to the main directory of the Repo and open index.js
![](https://i.imgur.com/4D8rWPf.png)

You'll see right off the back the names of the fruit glb files, so no coding needed! Just changing the fruit names to your file name.

**Scene Usage**

Here is an example of me changing the Infinifruit into a InfiniBorgor plant. the limits are endless!

![](https://i.imgur.com/ykJ0D7q.png)

**Host Your New Repo Through Github**

The great thing about Github is of course its openness but also the ability to host these items and tool for webaverse via github.

Once your new modded infinifruit is updated, you can head back to your github repo's settings page, then click on the page tab, and push your repo's brand to main to give you a custom URL.

![](https://i.imgur.com/rjORVcX.png)

By default it's set to none.

![](https://i.imgur.com/8ZZaOfR.png)


Learn more about how to build your own scenes in the [documentation](https://webaverse.notion.site/User-Docs-3a36b223e39b4f94b3d1f6921a4c297a) site.



## Attributions

