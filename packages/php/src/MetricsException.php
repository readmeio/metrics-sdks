<?php

namespace ReadMe;

class MetricsException extends \Exception
{
    /** @var array */
    private $errors = [];

    public function setErrors(array $errors): self
    {
        $this->errors = $errors;
        return $this;
    }

    public function getErrors(): array
    {
        return $this->errors;
    }
}
