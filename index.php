<!doctype html>
<html>
    <head>
        <title>Scrapyard</title>
        
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="theme-color" content="#5e2721" />
        
        <link href="//fonts.googleapis.com/css?family=Raleway:400,300,600" rel="stylesheet" type="text/css">
        <link rel="stylesheet" href="_css/skeleton/normalize.css">
        <link rel="stylesheet" href="_css/skeleton/skeleton.css">
        <link rel="stylesheet" href="_css/style.css">
    </head>
    <body>
        <div class="header">
            <div class="container">
                <div class="row">
                    <div class="twelve columns">
                        <h1>The Scrapyard</h1>
                    </div>
                </div>
            </div>
        </div>
        <div class="body container">
            <div class="row">
                <div class="twelve columns">
                    <p>Home to miscellaneous stuff. If I throw together a little web page or anything like that, it'll end up here.</p>
                    
                    <ul>
                    <?php
                        //Display a list of links to sub-folders containing projects
                        $directoryContents = scandir(".");
                        foreach ($directoryContents as $item)
                        {
                            //Look only for directories that don't start with '_'
                            if (strpos($item, ".") === false && strpos($item, "_") !== 0)
                            {
                                //Convert the folder name to a user-friendly Sentence Case name.
                                $displayNameWords = explode(" ", str_replace("-", " ", $item));
                                foreach ($displayNameWords as &$word)
                                {
                                    $word = ucfirst($word);
                                }
                                $displayName = implode(" ", $displayNameWords);
                                
                                ?>
                                <li>
                                    <a href="<?php echo $item; ?>/"><?php echo $displayName; ?></a>
                                </li>
                                <?php
                            }
                        }
                    ?>
                    </ul>
                </div>
            </div>
        </div>
    </body>
</html>