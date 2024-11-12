package com.readme.datatransfer;

import com.readme.domain.RequestMetadata;

public interface DataSender {

    int send(RequestMetadata requestMetadata);

}
