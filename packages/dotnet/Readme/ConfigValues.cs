﻿using Readme.HarJsonObjectModels;
using System.Collections.Generic;

namespace Readme
{
    public class ConfigValues
    {
        public string apiKey { get; set; }
        public Group group { get; set; }
        public Options options { get; set; }
    }

    public class Options
    {
        public List<string> allowList { get; set; }
        public bool isAllowListEmpty { get; set; }
        public List<string> denyList { get; set; }
        public bool isDenyListEmpty { get; set; }
        public bool development { get; set; } = false;
        public int bufferLength { get; set; } = 1;
        public string baseLogUrl { get; set; } = "https://example.readme.com";
    }
}
