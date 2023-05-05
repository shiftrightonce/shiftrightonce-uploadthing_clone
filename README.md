# Uploadthing clone without any dependency

For a production ready version, please use:
[Uploadthing](https://uploadthing.com/)

This is a proof of concept that we can build an file upload platform by
only using Deno's standard libraries. All coding is done on stream.

## Requirements

- Deno version >= 1.33

## Setup

N/A

## Run

This code is not ready for production. Please see instructions on how you
can run it in `dev` mode

## Developing

From the root of the project directory, run: `deno task dev`.

Default port: `8080`
Upload endpoint: `http://localhost:8080/v1/f`
Payload must be a `multipart form` and must have two fields

- `metadata`: A stringified JSON
- `files`: The file to upload

Note: You can upload multiple files under `files`

## Contribution

Fork and make it better. When you are ready so share, send a pull request.
